export type AccountSession = {
    readonly userId: string;
};

export type ApiKeyListItem = {
    readonly id: string;
    readonly name: string;
    readonly keyPrefix: string;
    readonly status: string;
    readonly createdAt: Date;
    readonly revokedAt: Date | null;
};

export type ApiKeyRecord = ApiKeyListItem & {
    readonly userId: string;
    readonly keyHash: string;
};

export type ApiKeyCreateInput = {
    readonly userId: string;
    readonly name: string;
    readonly keyHash: string;
    readonly keyPrefix: string;
    readonly status: string;
};

export type ApiKeyRevokeOutcome = {
    readonly tag: string;
};

export type ApiKeyPersistence = {
    readonly list: (userId: string) => Promise<readonly ApiKeyListItem[]>;
    readonly create: (input: ApiKeyCreateInput) => Promise<ApiKeyRecord>;
    readonly revoke: (userId: string, id: string) => Promise<ApiKeyRevokeOutcome>;
};

export type JsonRequest = {
    readonly json: () => Promise<unknown>;
};

export type ApiKeyRouteDependencies = {
    readonly readSession: () => Promise<AccountSession | null>;
    readonly persistence: ApiKeyPersistence;
    readonly randomHex: (byteCount: number) => string;
    readonly hash: (value: string) => string;
};
