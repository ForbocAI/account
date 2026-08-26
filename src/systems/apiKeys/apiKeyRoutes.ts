import apiKeyContract from '../../../data/contracts/api-keys.json';
import httpContract from '../../../data/contracts/http.json';
import { attempt, failure, matchNullable, matchResult, success } from '@/components/fp/result';
import type {
    AccountSession,
    ApiKeyRouteDependencies,
    JsonRequest,
} from '@/entities/apiKeys/apiKeyTypes';

type ApiKeyRoutes = {
    readonly list: () => Promise<Response>;
    readonly create: (request: JsonRequest) => Promise<Response>;
};

type NamedRequest = { readonly name?: unknown };

const json = (body: unknown, status: number): Response => Response.json(body, { status });

const internalFailure = (): Response => json(
    { error: httpContract.errors.internalServer },
    httpContract.status.internalServerError,
);

const unauthorized = (): Response => json(
    { error: httpContract.errors.unauthorized },
    httpContract.status.unauthorized,
);

const requestName = (body: unknown) => {
    const named = Object(body) as NamedRequest;
    const trimmed = typeof named.name === 'string' ? named.name.trim() : '';
    return trimmed.length > 0
        ? success(trimmed)
        : failure(httpContract.errors.keyNameRequired);
};

const maskedPrefix = (rawKey: string): string =>
    rawKey.slice(0, apiKeyContract.generation.visiblePrefixCharacters)
    + apiKeyContract.generation.mask
    + rawKey.slice(-apiKeyContract.generation.visibleSuffixCharacters);

export const createApiKeyRoutes = (dependencies: ApiKeyRouteDependencies): ApiKeyRoutes => {
    const withSession = async (
        operation: (session: AccountSession) => Promise<Response>,
    ): Promise<Response> => matchResult(await attempt(dependencies.readSession), {
        failure: async () => internalFailure(),
        success: (session) => matchNullable(session, {
            nothing: async () => unauthorized(),
            present: operation,
        }),
    });

    const list = (): Promise<Response> => withSession(async (session) =>
        matchResult(await attempt(() => dependencies.persistence.list(session.userId)), {
            failure: internalFailure,
            success: (keys) => json({ keys }, httpContract.status.ok),
        }));

    const create = (request: JsonRequest): Promise<Response> => withSession(async (session) =>
        matchResult(await attempt(request.json), {
            failure: async () => json(
                { error: httpContract.errors.invalidJson },
                httpContract.status.badRequest,
            ),
            success: async (body) => matchResult(requestName(body), {
                failure: async (error) => json(
                    { error },
                    httpContract.status.badRequest,
                ),
                success: async (name) => {
                    const rawKey = apiKeyContract.generation.prefix
                        + dependencies.randomHex(apiKeyContract.generation.entropyBytes);
                    return matchResult(await attempt(() => dependencies.persistence.create({
                        userId: session.userId,
                        name,
                        keyHash: dependencies.hash(rawKey),
                        keyPrefix: maskedPrefix(rawKey),
                        status: apiKeyContract.status.active,
                    })), {
                        failure: internalFailure,
                        success: (record) => json({
                            key: {
                                id: record.id,
                                name: record.name,
                                rawKey,
                                keyPrefix: record.keyPrefix,
                                status: record.status,
                                createdAt: record.createdAt,
                            },
                        }, httpContract.status.created),
                    });
                },
            }),
        }));

    return { list, create };
};
