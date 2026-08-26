import { describe, expect, it } from 'vitest';
import authRateLimitContract from '../../../../data/contracts/auth-rate-limit.json';
import fixture from '../../../../data/tests/auth.json';
import { createLocalAuthRateLimitProvider } from '@/components/auth/localAuthRateLimitProvider';

describe(fixture.cases.localProvider, () => {
    it(fixture.cases.window, async () => {
        const provider = createLocalAuthRateLimitProvider();
        const policy = authRateLimitContract.policies.login;
        const startedAt = new Date(fixture.clock.startEpochMilliseconds);
        const first = await provider.consume(fixture.hashSecret, policy, startedAt);
        const afterWindow = new Date(
            startedAt.getTime()
            + policy.windowMilliseconds
            + fixture.clock.afterWindowPaddingMilliseconds,
        );
        const reset = await provider.consume(fixture.hashSecret, policy, afterWindow);

        expect(first.requestCount).toBe(authRateLimitContract.minimumRetryAfterSeconds);
        expect(reset.requestCount).toBe(authRateLimitContract.minimumRetryAfterSeconds);
        expect(reset.expiresAt.getTime()).toBe(afterWindow.getTime() + policy.windowMilliseconds);
    });
});
