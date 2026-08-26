import type { PrismaClient } from '@prisma/client';
import authRateLimitContract from '../../../data/contracts/auth-rate-limit.json';
import { matchNullable } from '@/components/fp/result';
import type { AuthRateLimitProvider } from '@/entities/auth/authRateLimitTypes';

type AuthRateLimitRow = {
    readonly request_count: number;
    readonly expires_at: Date;
};

export const createPostgresAuthRateLimitProvider = (
    prisma: PrismaClient,
): AuthRateLimitProvider => ({
    consume: async (keyHash, policy, now) => {
        const expiresAt = new Date(now.getTime() + policy.windowMilliseconds);
        const rows = await prisma.$queryRaw<AuthRateLimitRow[]>`
            INSERT INTO "auth_rate_limit_buckets" (
                "key_hash",
                "request_count",
                "window_started_at",
                "expires_at",
                "updated_at"
            )
            VALUES (${keyHash}, 1, ${now}, ${expiresAt}, ${now})
            ON CONFLICT ("key_hash") DO UPDATE SET
                "request_count" = CASE
                    WHEN "auth_rate_limit_buckets"."expires_at" <= ${now} THEN 1
                    ELSE "auth_rate_limit_buckets"."request_count" + 1
                END,
                "window_started_at" = CASE
                    WHEN "auth_rate_limit_buckets"."expires_at" <= ${now} THEN ${now}
                    ELSE "auth_rate_limit_buckets"."window_started_at"
                END,
                "expires_at" = CASE
                    WHEN "auth_rate_limit_buckets"."expires_at" <= ${now} THEN ${expiresAt}
                    ELSE "auth_rate_limit_buckets"."expires_at"
                END,
                "updated_at" = ${now}
            RETURNING "request_count", "expires_at"
        `;
        const row = rows[0];
        return matchNullable(row, {
            nothing: () => {
                throw new Error(authRateLimitContract.messages.persistenceEmpty);
            },
            present: (presentRow) => ({
                requestCount: presentRow.request_count,
                expiresAt: presentRow.expires_at,
            }),
        });
    },
});
