import apiKeyContract from '../../../data/contracts/api-keys.json';
import { prisma } from '@/lib/db';
import type {
    ApiKeyCreateInput,
    ApiKeyListItem,
    ApiKeyPersistence,
    ApiKeyRecord,
    ApiKeyRevokeOutcome,
} from '@/entities/apiKeys/apiKeyTypes';
import { matchNullable } from '@/components/fp/result';

const list = (userId: string): Promise<readonly ApiKeyListItem[]> =>
    prisma.apiKey.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            status: true,
            createdAt: true,
            revokedAt: true,
        },
        orderBy: {
            createdAt: apiKeyContract.ordering.createdAt as 'asc' | 'desc',
        },
    });

const create = (input: ApiKeyCreateInput): Promise<ApiKeyRecord> =>
    prisma.apiKey.create({ data: input });

const revoke = (userId: string, id: string): Promise<ApiKeyRevokeOutcome> =>
    prisma.$transaction(async (transaction) => {
        const record = await transaction.apiKey.findFirst({ where: { id, userId } });
        return matchNullable(record, {
            nothing: async () => ({ tag: apiKeyContract.revoke.outcomes.notFound }),
            present: (presentRecord) => {
                const effects: Readonly<Record<string, () => Promise<ApiKeyRevokeOutcome>>> = {
                    [apiKeyContract.status.active]: async () => {
                        await transaction.apiKey.update({
                            where: { id: presentRecord.id },
                            data: {
                                status: apiKeyContract.status.revoked,
                                revokedAt: new Date(),
                            },
                        });
                        return { tag: apiKeyContract.revoke.outcomes.revoked };
                    },
                    [apiKeyContract.status.revoked]: async () => ({
                        tag: apiKeyContract.revoke.outcomes.alreadyRevoked,
                    }),
                };
                return (effects[presentRecord.status]
                    ?? effects[apiKeyContract.status.revoked])();
            },
        });
    });

export const apiKeyPersistence: ApiKeyPersistence = { list, create, revoke };
