import { createHash, randomBytes } from 'node:crypto';
import apiKeyContract from '../../../data/contracts/api-keys.json';
import { getSessionFromCookies } from '@/lib/auth';
import { createApiKeyRoutes } from '@/systems/apiKeys/apiKeyRoutes';
import { apiKeyPersistence } from './apiKeyPersistence';

export const configuredApiKeyRoutes = createApiKeyRoutes({
    readSession: getSessionFromCookies,
    persistence: apiKeyPersistence,
    randomHex: (byteCount) => randomBytes(byteCount)
        .toString(apiKeyContract.generation.encoding as BufferEncoding),
    hash: (value) => createHash(apiKeyContract.generation.hashAlgorithm)
        .update(value)
        .digest()
        .toString(apiKeyContract.generation.encoding as BufferEncoding),
});
