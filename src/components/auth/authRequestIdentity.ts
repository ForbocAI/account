import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';

const normalizeHops = (trustedProxyHops: number): number =>
    Number.isFinite(trustedProxyHops)
        ? Math.max(0, Math.floor(trustedProxyHops))
        : authRateLimitContract.identity.defaultTrustedProxyHops;

const validIpOrAnonymous = (candidate: string | null): string =>
    candidate && isIP(candidate) > 0
        ? candidate
        : authRateLimitContract.identity.anonymous;

export const resolveAuthRequestIdentity = (
    headers: Headers,
    trustedProxyHops: number,
): string => {
    const forwarded = headers.get(authRateLimitContract.identity.forwardedForHeader);
    if (forwarded) {
        const chain = forwarded.split(',').map((entry) => entry.trim());
        const selectedIndex = Math.max(0, chain.length - normalizeHops(trustedProxyHops) - 1);
        return validIpOrAnonymous(chain[selectedIndex] ?? null);
    }

    return validIpOrAnonymous(headers.get(authRateLimitContract.identity.realIpHeader));
};

export const hashAuthRequestIdentity = (
    scope: string,
    identity: string,
    secret: string,
): string => createHmac(authRateLimitContract.identity.hashAlgorithm, secret)
    .update(`${scope}${authRateLimitContract.identity.separator}${identity}`)
    .digest('hex');
