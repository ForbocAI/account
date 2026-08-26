import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import apiKeyContract from '../../../data/contracts/api-keys.json';
import httpContract from '../../../data/contracts/http.json';
import fixtures from '../../../data/tests/api-keys.json';
import { apiKeyPersistence } from '@/components/apiKeys/apiKeyPersistence';
import { createApiKeyRoutes } from '@/systems/apiKeys/apiKeyRoutes';
import { prisma } from './setup';

describe(fixtures.suite, () => {
    it(fixtures.cases.create, async () => {
        const user = await prisma.user.create({
            data: fixtures.user,
        });
        const routes = createApiKeyRoutes({
            readSession: async () => ({ userId: user.id }),
            persistence: apiKeyPersistence,
            randomHex: () => fixtures.generated.hex,
            hash: (value) => createHash(apiKeyContract.generation.hashAlgorithm)
                .update(value)
                .digest(apiKeyContract.generation.encoding as 'hex'),
        });
        const response = await routes.create({ json: async () => fixtures.requests.valid });
        const body = await response.json();
        const keyHash = createHash(apiKeyContract.generation.hashAlgorithm)
            .update(body.key.rawKey)
            .digest(apiKeyContract.generation.encoding as 'hex');
        const stored = await prisma.apiKey.findUnique({ where: { keyHash } });

        expect(response.status).toBe(httpContract.status.created);
        expect(stored?.userId).toBe(user.id);
        expect(stored?.status).toBe(apiKeyContract.status.active);
        expect(stored).not.toHaveProperty('rawKey');
    });

    it(fixtures.cases.revoke, async () => {
        const user = await prisma.user.create({
            data: fixtures.user,
        });

        const apiKey = await prisma.apiKey.create({
            data: {
                userId: user.id,
                name: fixtures.requests.valid.name,
                keyHash: fixtures.generated.hash,
                keyPrefix: apiKeyContract.generation.prefix,
            },
        });

        const revoked = await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { status: apiKeyContract.status.revoked, revokedAt: new Date() },
        });

        expect(revoked.status).toBe(apiKeyContract.status.revoked);
        expect(revoked.revokedAt).toBeDefined();
    });
});
