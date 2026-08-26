import type {
    AuthRateLimitProvider,
    AuthRateLimitSnapshot,
} from '@/entities/auth/authRateLimitTypes';

type LocalBucket = AuthRateLimitSnapshot;

export const createLocalAuthRateLimitProvider = (): AuthRateLimitProvider => {
    const buckets = new Map<string, LocalBucket>();

    return {
        consume: async (keyHash, policy, now) => {
            const existing = buckets.get(keyHash);
            const active = existing && existing.expiresAt.getTime() > now.getTime();
            const snapshot = active
                ? {
                    requestCount: existing.requestCount + 1,
                    expiresAt: existing.expiresAt,
                }
                : {
                    requestCount: 1,
                    expiresAt: new Date(now.getTime() + policy.windowMilliseconds),
                };
            buckets.set(keyHash, snapshot);
            return snapshot;
        },
    };
};
