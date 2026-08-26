import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../data/contracts/http.json';
import { attempt, matchResult } from '@/components/fp/result';
import {
    hashAuthRequestIdentity,
    resolveAuthRequestIdentity,
} from '@/components/auth/authRequestIdentity';
import { createLocalAuthRateLimitProvider } from '@/components/auth/localAuthRateLimitProvider';
import { createPostgresAuthRateLimitProvider } from '@/components/auth/postgresAuthRateLimitProvider';
import type {
    AuthRateLimitDecision,
    AuthRateLimitGate,
    AuthRateLimitGateDependencies,
    AuthRateLimitPolicy,
    AuthRateLimitPolicyName,
    AuthRateLimitProvider,
    AuthRateLimitSnapshot,
} from '@/entities/auth/authRateLimitTypes';
import { prisma } from '@/lib/db';

const policyByName = authRateLimitContract.policies as Readonly<
    Record<AuthRateLimitPolicyName, AuthRateLimitPolicy>
>;

const retryAfterSeconds = (resetAt: Date, now: Date): number => Math.max(
    authRateLimitContract.minimumRetryAfterSeconds,
    Math.ceil(
        (resetAt.getTime() - now.getTime())
        / authRateLimitContract.millisecondsPerSecond,
    ),
);

const consumeBeforeTimeout = (
    effect: Promise<Awaited<ReturnType<AuthRateLimitProvider['consume']>>>,
    timeoutMilliseconds: number,
) => new Promise<Awaited<ReturnType<AuthRateLimitProvider['consume']>>>((resolve, reject) => {
    const timeout = setTimeout(
        () => reject(new Error(authRateLimitContract.messages.timeout)),
        timeoutMilliseconds,
    );
    effect.then(
        (value) => {
            clearTimeout(timeout);
            resolve(value);
        },
        (error) => {
            clearTimeout(timeout);
            reject(error);
        },
    );
});

export const evaluateAuthRateLimit = async (
    request: Request,
    policyName: AuthRateLimitPolicyName,
    dependencies: AuthRateLimitGateDependencies,
): Promise<AuthRateLimitDecision> => {
    const policy = policyByName[policyName];
    const identity = resolveAuthRequestIdentity(request.headers, dependencies.trustedProxyHops);
    const keyHash = hashAuthRequestIdentity(policy.scope, identity, dependencies.hashSecret);
    const now = dependencies.now();
    return matchResult<unknown, AuthRateLimitSnapshot, AuthRateLimitDecision>(await attempt(() => consumeBeforeTimeout(
        dependencies.provider.consume(keyHash, policy, now),
        dependencies.timeoutMilliseconds,
    )), {
        failure: () => ({
            tag: 'unavailable',
            retryAfterSeconds: authRateLimitContract.unavailableRetryAfterSeconds,
        }),
        success: (snapshot) => snapshot.requestCount > policy.limit
            ? {
                tag: 'limited',
                retryAfterSeconds: retryAfterSeconds(snapshot.expiresAt, now),
                resetAt: snapshot.expiresAt,
            }
            : {
                tag: 'allowed',
                remaining: policy.limit - snapshot.requestCount,
                resetAt: snapshot.expiresAt,
            },
    });
};

const decisionResponse = (decision: AuthRateLimitDecision): Response | null =>
    decision.tag === 'allowed'
        ? null
        : Response.json(
            {
                error: decision.tag === 'limited'
                    ? authRateLimitContract.messages.limited
                    : authRateLimitContract.messages.unavailable,
            },
            {
                status: decision.tag === 'limited'
                    ? httpContract.status.tooManyRequests
                    : httpContract.status.serviceUnavailable,
                headers: {
                    [authRateLimitContract.headers.retryAfter]: String(decision.retryAfterSeconds),
                },
            },
        );

export const createAuthRateLimitGate = (
    dependencies: AuthRateLimitGateDependencies,
): AuthRateLimitGate => async (request, policyName) => decisionResponse(
    await evaluateAuthRateLimit(request, policyName, dependencies),
);

const rateLimitGlobal = globalThis as unknown as {
    accountLocalRateLimitProvider?: AuthRateLimitProvider;
};

const localProvider = (): AuthRateLimitProvider => {
    rateLimitGlobal.accountLocalRateLimitProvider ??= createLocalAuthRateLimitProvider();
    return rateLimitGlobal.accountLocalRateLimitProvider;
};

const postgresProvider = createPostgresAuthRateLimitProvider(prisma);

const configuredProvider = (): AuthRateLimitProvider | null => {
    const providerName = process.env[authRateLimitContract.provider.environment]
        ?? authRateLimitContract.provider.default;
    return providerName === authRateLimitContract.provider.postgres
        ? postgresProvider
        : providerName === authRateLimitContract.provider.local
            ? localProvider()
            : null;
};

const configuredTrustedProxyHops = (): number => {
    const configured = Number(
        process.env[authRateLimitContract.identity.trustedProxyHopsEnvironment],
    );
    return Number.isFinite(configured)
        ? configured
        : authRateLimitContract.identity.defaultTrustedProxyHops;
};

export const configuredAuthRateLimitGate: AuthRateLimitGate = async (request, policyName) => {
    const provider = configuredProvider();
    const hashSecret = process.env[authRateLimitContract.identity.hashSecretEnvironment];
    return !provider || !hashSecret
        ? decisionResponse({
            tag: 'unavailable',
            retryAfterSeconds: authRateLimitContract.unavailableRetryAfterSeconds,
        })
        : createAuthRateLimitGate({
            provider,
            hashSecret,
            now: () => new Date(),
            trustedProxyHops: configuredTrustedProxyHops(),
            timeoutMilliseconds: authRateLimitContract.providerTimeoutMilliseconds,
        })(request, policyName);
};
