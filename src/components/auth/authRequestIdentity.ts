import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';

const normalizeHops = (trustedProxyHops: number): number =>
    Number.isFinite(trustedProxyHops)
        ? Math.max(
            authRateLimitContract.identity.minimumTrustedProxyHops,
            Math.floor(trustedProxyHops),
        )
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
    return forwarded
        ? validIpOrAnonymous((() => {
            const chain = forwarded
                .split(authRateLimitContract.identity.forwardedForSeparator)
                .map((entry) => entry.trim());
            const selectedIndex = Math.max(
                authRateLimitContract.identity.minimumTrustedProxyHops,
                chain.length
                - normalizeHops(trustedProxyHops)
                - authRateLimitContract.identity.selectedClientOffset,
            );
            return chain[selectedIndex] ?? null;
        })())
        : validIpOrAnonymous(headers.get(authRateLimitContract.identity.realIpHeader));
};

export const hashAuthRequestIdentity = (
    scope: string,
    identity: string,
    secret: string,
): string => createHmac(authRateLimitContract.identity.hashAlgorithm, secret)
    .update(`${scope}${authRateLimitContract.identity.separator}${identity}`)
    .digest()
    .toString(authRateLimitContract.identity.hashEncoding as BufferEncoding);
