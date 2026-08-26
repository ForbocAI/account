import { describe, expect, it } from 'vitest';
import authRateLimitContract from '../../../../data/contracts/auth-rate-limit.json';
import httpContract from '../../../../data/contracts/http.json';
import fixture from '../../../../data/tests/auth.json';
import type { AuthRateLimitPolicyName } from '@/entities/auth/authRateLimitTypes';
import { createAuthRateLimitGate } from '@/systems/auth/authRateLimit';

const request = (): Request => new Request(fixture.requestUrl, {
    headers: {
        [authRateLimitContract.identity.forwardedForHeader]: fixture.forwardedChain,
    },
});

const dependencies = (consume: () => Promise<never>) => ({
    provider: { consume },
    hashSecret: fixture.hashSecret,
    now: () => new Date(fixture.clock.startEpochMilliseconds),
    trustedProxyHops: authRateLimitContract.identity.defaultTrustedProxyHops,
    timeoutMilliseconds: fixture.clock.shortTimeoutMilliseconds,
});

describe(fixture.cases.gate, () => {
    it(fixture.cases.timeout, async () => {
        const delayedFailure = () => new Promise<never>((_resolve, reject) => {
            setTimeout(
                () => reject(new Error(authRateLimitContract.messages.timeout)),
                fixture.clock.providerDelayMilliseconds,
            );
        });
        const response = await createAuthRateLimitGate(dependencies(delayedFailure))(
            request(),
            authRateLimitContract.policies.login.scope as AuthRateLimitPolicyName,
        );

        expect(response?.status).toBe(httpContract.status.serviceUnavailable);
        expect(response?.headers.get(authRateLimitContract.headers.retryAfter)).toBe(
            String(authRateLimitContract.unavailableRetryAfterSeconds),
        );
    });

    it(fixture.cases.unavailable, async () => {
        const unavailable = () => Promise.reject<never>(new Error(fixture.cases.unavailable));
        const response = await createAuthRateLimitGate(dependencies(unavailable))(
            request(),
            authRateLimitContract.policies.login.scope as AuthRateLimitPolicyName,
        );

        expect(response?.status).toBe(httpContract.status.serviceUnavailable);
        expect(await response?.json()).toEqual({
            error: authRateLimitContract.messages.unavailable,
        });
    });
});
