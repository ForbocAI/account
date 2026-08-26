export type AuthCredentials = {
    readonly email: string;
    readonly password: string;
};

export type AuthUser = {
    readonly id: string;
    readonly email: string;
    readonly createdAt?: string;
};

export type AuthDocument = {
    readonly user: AuthUser;
};

export type LogoutDocument = {
    readonly success: boolean;
};
