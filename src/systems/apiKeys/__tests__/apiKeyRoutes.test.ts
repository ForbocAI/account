import { describe, expect, it, vi } from 'vitest';
import apiKeyContract from '../../../../data/contracts/api-keys.json';
import httpContract from '../../../../data/contracts/http.json';
import fixtures from '../../../../data/tests/api-keys.json';
import type { ApiKeyRouteDependencies } from '@/entities/apiKeys/apiKeyTypes';
import { createApiKeyRoutes } from '@/systems/apiKeys/apiKeyRoutes';

const createdAt = new Date(fixtures.record.createdAt);
const rawKey = apiKeyContract.generation.prefix + fixtures.generated.hex;
const keyPrefix = rawKey.slice(
    fixtures.sequence.firstIndex,
    apiKeyContract.generation.visiblePrefixCharacters,
)
    + apiKeyContract.generation.mask
    + rawKey.slice(-apiKeyContract.generation.visibleSuffixCharacters);

const record = {
    id: fixtures.record.id,
    userId: fixtures.session.userId,
    name: fixtures.requests.valid.name,
    keyHash: fixtures.generated.hash,
    keyPrefix,
    status: apiKeyContract.status.active,
    createdAt,
    revokedAt: fixtures.record.revokedAt,
};

const dependencies = (
    overrides: Partial<ApiKeyRouteDependencies> = {},
): ApiKeyRouteDependencies => ({
    readSession: async () => fixtures.session,
    persistence: {
        list: async () => [record],
        create: async () => record,
        revoke: async () => ({ tag: apiKeyContract.revoke.outcomes.revoked }),
    },
    randomHex: () => fixtures.generated.hex,
    hash: () => fixtures.generated.hash,
    ...overrides,
});

const request = (body: unknown) => ({ json: async () => body });

describe(fixtures.suite, () => {
    it(fixtures.cases.unauthorized, async () => {
        const response = await createApiKeyRoutes(dependencies({
            readSession: async () => fixtures.session.missing,
        })).list();

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(httpContract.status.unauthorized);
        expect(await response.json()).toEqual({ error: httpContract.errors.unauthorized });
    });

    it(fixtures.cases.invalidName, async () => {
        const response = await createApiKeyRoutes(dependencies()).create(
            request(fixtures.requests.invalid),
        );

        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: httpContract.errors.keyNameRequired });
    });

    it(fixtures.cases.list, async () => {
        const response = await createApiKeyRoutes(dependencies()).list();

        expect(response.status).toBe(httpContract.status.ok);
        expect(await response.json()).toEqual({
            keys: [{ ...record, createdAt: fixtures.record.createdAt }],
        });
    });

    it(fixtures.cases.create, async () => {
        const create = vi.fn(async () => record);
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => [],
                create,
                revoke: async () => ({ tag: apiKeyContract.revoke.outcomes.revoked }),
            },
        })).create(request(fixtures.requests.valid));

        expect(response.status).toBe(httpContract.status.created);
        expect(await response.json()).toEqual({
            key: {
                id: record.id,
                name: record.name,
                rawKey,
                keyPrefix,
                status: record.status,
                createdAt: fixtures.record.createdAt,
            },
        });
        expect(create).toHaveBeenCalledWith({
            userId: fixtures.session.userId,
            name: fixtures.requests.valid.name,
            keyHash: fixtures.generated.hash,
            keyPrefix,
            status: apiKeyContract.status.active,
        });
    });

    it(fixtures.cases.failure, async () => {
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => Promise.reject(new Error(fixtures.failure.message)),
                create: async () => record,
                revoke: async () => ({ tag: apiKeyContract.revoke.outcomes.revoked }),
            },
        })).list();

        expect(response.status).toBe(httpContract.status.internalServerError);
        expect(await response.json()).toEqual({ error: httpContract.errors.internalServer });
    });

    it(fixtures.cases.revokeMissing, async () => {
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => [record],
                create: async () => record,
                revoke: async () => ({ tag: apiKeyContract.revoke.outcomes.notFound }),
            },
        })).revoke(fixtures.requests.revokeId);

        expect(response.status).toBe(httpContract.status.notFound);
        expect(await response.json()).toEqual({ error: httpContract.errors.keyNotFound });
    });

    it(fixtures.cases.revokeRepeated, async () => {
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => [record],
                create: async () => record,
                revoke: async () => ({ tag: apiKeyContract.revoke.outcomes.alreadyRevoked }),
            },
        })).revoke(fixtures.requests.revokeId);

        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: httpContract.errors.keyAlreadyRevoked });
    });

    it(fixtures.cases.revoke, async () => {
        const revoke = vi.fn(async () => ({ tag: apiKeyContract.revoke.outcomes.revoked }));
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => [record],
                create: async () => record,
                revoke,
            },
        })).revoke(fixtures.requests.revokeId);

        expect(response.status).toBe(httpContract.status.ok);
        expect(await response.json()).toEqual(apiKeyContract.revoke.success);
        expect(revoke).toHaveBeenCalledWith(
            fixtures.session.userId,
            fixtures.requests.revokeId,
        );
    });

    it(fixtures.cases.revokeFailure, async () => {
        const response = await createApiKeyRoutes(dependencies({
            persistence: {
                list: async () => [record],
                create: async () => record,
                revoke: async () => Promise.reject(new Error(fixtures.failure.message)),
            },
        })).revoke(fixtures.requests.revokeId);

        expect(response.status).toBe(httpContract.status.internalServerError);
        expect(await response.json()).toEqual({ error: httpContract.errors.internalServer });
    });
});
