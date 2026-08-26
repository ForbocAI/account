export type AuthRateLimitPolicy = {
    readonly scope: string;
    readonly limit: number;
    readonly windowMilliseconds: number;
};

export type AuthRateLimitSnapshot = {
    readonly requestCount: number;
    readonly expiresAt: Date;
};

export type AuthRateLimitProvider = {
    readonly consume: (
        keyHash: string,
        policy: AuthRateLimitPolicy,
        now: Date,
    ) => Promise<AuthRateLimitSnapshot>;
};

export type AuthRateLimitDecision =
    | {
        readonly tag: 'allowed';
        readonly remaining: number;
        readonly resetAt: Date;
    }
    | {
        readonly tag: 'limited';
        readonly retryAfterSeconds: number;
        readonly resetAt: Date;
    }
    | {
        readonly tag: 'unavailable';
        readonly retryAfterSeconds: number;
    };

export type AuthRateLimitGateDependencies = {
    readonly provider: AuthRateLimitProvider;
    readonly hashSecret: string;
    readonly now: () => Date;
    readonly trustedProxyHops: number;
    readonly timeoutMilliseconds: number;
};

export type AuthRateLimitPolicyName = 'login' | 'signup';

export type AuthRateLimitGate = (
    request: Request,
    policyName: AuthRateLimitPolicyName,
) => Promise<Response | null>;
