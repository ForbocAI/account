import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import authContract from '../../../data/contracts/auth.json';
import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../data/contracts/http.json';
import fixture from '../../../data/tests/auth.json';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as signup } from '@/app/api/auth/signup/route';
import { createPostgresAuthRateLimitProvider } from '@/components/auth/postgresAuthRateLimitProvider';
import type { AuthRateLimitPolicyName } from '@/entities/auth/authRateLimitTypes';
import { hashPassword } from '@/lib/password';
import { createAuthRateLimitGate } from '@/systems/auth/authRateLimit';
import { prisma } from './setup';

const authRequest = (url: string, credentials: typeof fixture.user): NextRequest =>
    new NextRequest(url, {
        method: authContract.methods.create,
        headers: {
            [fixture.headers.contentType]: fixture.headers.jsonContentType,
            [authRateLimitContract.identity.forwardedForHeader]: fixture.forwardedChain,
        },
        body: JSON.stringify(credentials),
    });

describe(fixture.cases.route, () => {
    it(fixture.cases.login, async () => {
        await prisma.user.create({
            data: {
                email: fixture.user.email,
                passwordHash: await hashPassword(fixture.user.password),
            },
        });

        const response = await login(authRequest(fixture.requestUrl, fixture.user));
        expect(response.status).toBe(httpContract.status.ok);
        expect(response.headers.get(fixture.headers.setCookie)).toContain(authContract.cookie.name);
        expect((await response.json()).user.email).toBe(fixture.user.email);
    });

    it(fixture.cases.logout, async () => {
        const response = await logout();
        const cookie = response.headers.get(fixture.headers.setCookie);
        expect(response.status).toBe(httpContract.status.ok);
        expect(cookie).toContain(
            authContract.cookie.name + fixture.cookie.assignmentSeparator,
        );
        expect(cookie).toContain(
            fixture.cookie.maxAgeAttribute
            + fixture.cookie.assignmentSeparator
            + String(authContract.cookie.clearMaxAgeSeconds),
        );
    });

    it(fixture.cases.signup, async () => {
        const response = await signup(authRequest(fixture.signupUrl, fixture.user));
        expect(response.status).toBe(httpContract.status.created);
        expect(response.headers.get(fixture.headers.setCookie)).toContain(authContract.cookie.name);
        expect(await prisma.user.findUnique({
            where: { email: fixture.user.email },
        })).not.toBeNull();
    });

    it(fixture.cases.duplicate, async () => {
        expect((await signup(authRequest(
            fixture.signupUrl,
            fixture.duplicateUser,
        ))).status).toBe(httpContract.status.created);
        expect((await signup(authRequest(
            fixture.signupUrl,
            fixture.duplicateUser,
        ))).status).toBe(httpContract.status.conflict);
    });

    it(fixture.cases.limited, async () => {
        const attempts = Array.from(
            { length: authRateLimitContract.policies.login.limit },
            () => login(authRequest(fixture.requestUrl, fixture.user)),
        );
        const responses = await Promise.all(attempts);
        expect(responses.every(
            (response) => response.status === httpContract.status.unauthorized,
        )).toBe(true);

        const blocked = await login(authRequest(fixture.requestUrl, fixture.user));
        expect(blocked.status).toBe(httpContract.status.tooManyRequests);
        expect(blocked.headers.get(authRateLimitContract.headers.retryAfter)).not.toBeNull();
    });

    it(fixture.cases.misconfigured, async () => {
        const providerEnvironment = authRateLimitContract.provider.environment;
        const configured = process.env[providerEnvironment];
        process.env[providerEnvironment] = fixture.invalidProvider;
        try {
            const response = await login(authRequest(fixture.requestUrl, fixture.user));
            expect(response.status).toBe(httpContract.status.serviceUnavailable);
        } finally {
            process.env[providerEnvironment] = configured;
        }
    });
});

describe(fixture.cases.sharedDatabase, () => {
    it(fixture.cases.concurrent, async () => {
        const now = new Date(fixture.clock.startEpochMilliseconds);
        const dependencies = (provider: ReturnType<typeof createPostgresAuthRateLimitProvider>) => ({
            provider,
            hashSecret: fixture.hashSecret,
            now: () => now,
            trustedProxyHops: authRateLimitContract.identity.defaultTrustedProxyHops,
            timeoutMilliseconds: authRateLimitContract.providerTimeoutMilliseconds,
        });
        const firstInstance = createAuthRateLimitGate(dependencies(
            createPostgresAuthRateLimitProvider(prisma),
        ));
        const secondInstance = createAuthRateLimitGate(dependencies(
            createPostgresAuthRateLimitProvider(prisma),
        ));
        const attemptCount = authRateLimitContract.policies.login.limit
            + authRateLimitContract.minimumRetryAfterSeconds;
        const responses = await Promise.all(Array.from(
            { length: attemptCount },
            (_entry, index) => (
                index % fixture.instanceCount === fixture.sequence.firstRemainder
                    ? firstInstance
                    : secondInstance
            )(
                authRequest(fixture.requestUrl, fixture.user),
                authRateLimitContract.policies.login.scope as AuthRateLimitPolicyName,
            ),
        ));
        const blocked = responses.filter((response) =>
            response?.status === httpContract.status.tooManyRequests);
        const buckets = await prisma.authRateLimitBucket.findMany();

        expect(blocked).toHaveLength(authRateLimitContract.minimumRetryAfterSeconds);
        expect(buckets).toHaveLength(authRateLimitContract.minimumRetryAfterSeconds);
        const bucket = buckets.at(fixture.sequence.firstIndex);
        expect(bucket?.requestCount).toBe(attemptCount);
        expect(bucket?.keyHash).not.toContain(fixture.clientIp);
    });

    it(fixture.cases.databaseWindow, async () => {
        const provider = createPostgresAuthRateLimitProvider(prisma);
        const policy = authRateLimitContract.policies.login;
        const startedAt = new Date(fixture.clock.startEpochMilliseconds);
        const keyHash = fixture.hashSecret;
        await provider.consume(keyHash, policy, startedAt);
        const afterWindow = new Date(
            startedAt.getTime()
            + policy.windowMilliseconds
            + fixture.clock.afterWindowPaddingMilliseconds,
        );
        const reset = await provider.consume(keyHash, policy, afterWindow);

        expect(reset.requestCount).toBe(authRateLimitContract.minimumRetryAfterSeconds);
        expect(reset.expiresAt.getTime()).toBe(afterWindow.getTime() + policy.windowMilliseconds);
    });
});
