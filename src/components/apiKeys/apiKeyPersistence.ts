import apiKeyContract from '../../../data/contracts/api-keys.json';
import { prisma } from '@/lib/db';
import type {
    ApiKeyCreateInput,
    ApiKeyListItem,
    ApiKeyPersistence,
    ApiKeyRecord,
} from '@/entities/apiKeys/apiKeyTypes';

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

export const apiKeyPersistence: ApiKeyPersistence = { list, create };
