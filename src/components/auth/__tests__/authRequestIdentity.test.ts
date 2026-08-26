import { describe, expect, it } from 'vitest';
import authRateLimitContract from '../../../../data/contracts/auth-rate-limit.json';
import fixture from '../../../../data/tests/auth.json';
import { resolveAuthRequestIdentity } from '@/components/auth/authRequestIdentity';

const headers = (forwardedFor: string): Headers => new Headers({
    [authRateLimitContract.identity.forwardedForHeader]: forwardedFor,
});

describe(fixture.cases.identity, () => {
    it(fixture.cases.trustedProxy, () => {
        expect(resolveAuthRequestIdentity(
            headers(fixture.forwardedChain),
            authRateLimitContract.identity.defaultTrustedProxyHops,
        )).toBe(fixture.clientIp);
        expect(resolveAuthRequestIdentity(
            headers(fixture.twoProxyForwardedChain),
            fixture.twoProxyTrustedHops,
        )).toBe(fixture.clientIp);
    });

    it(fixture.cases.invalidIdentity, () => {
        expect(resolveAuthRequestIdentity(
            headers(fixture.invalidIp),
            authRateLimitContract.identity.defaultTrustedProxyHops,
        )).toBe(authRateLimitContract.identity.anonymous);
    });
});
