import type Stripe from 'stripe';

export type BillingPlan = {
    readonly key: string;
    readonly name: string;
    readonly price: string;
    readonly requestsPerDay: number;
    readonly requestsLabel: string;
    readonly priceEnvironment: string | null;
    readonly features: readonly string[];
    readonly highlighted?: boolean;
};

export type BillingSubscriptionDocument = {
    readonly status: string;
    readonly currentPeriodEnd: string;
    readonly cancelAtPeriodEnd: boolean;
};

export type BillingDocument = {
    readonly plan: string;
    readonly planName: string;
    readonly requestsPerDay: number;
    readonly subscription: BillingSubscriptionDocument | null;
};

export type CheckoutRequest = {
    readonly planKey: string;
};

export type RedirectDocument = {
    readonly url: string | null;
};

export type SubscriptionProjection = {
    readonly subscriptionId: string;
    readonly customerId: string;
    readonly userId: string | null;
    readonly planKey: string | null;
    readonly priceId: string;
    readonly status: string;
    readonly currentPeriodStart: Date;
    readonly currentPeriodEnd: Date;
    readonly cancelAtPeriodEnd: boolean;
};

type WebhookIdentity = {
    readonly eventId: string;
    readonly eventType: string;
    readonly eventCreatedAt: Date;
};

export type HydrateCheckoutInstruction = WebhookIdentity & {
    readonly kind: 'hydrate-checkout';
    readonly subscriptionId: string;
    readonly customerId: string;
    readonly userId: string;
    readonly planKey: string;
};

export type ApplySubscriptionInstruction = WebhookIdentity & {
    readonly kind: 'apply-subscription';
    readonly action: string;
    readonly projection: SubscriptionProjection;
};

export type IgnoreWebhookInstruction = WebhookIdentity & {
    readonly kind: 'ignore';
};

export type StripeWebhookInstruction =
    | HydrateCheckoutInstruction
    | ApplySubscriptionInstruction
    | IgnoreWebhookInstruction;

export type BillingWebhookCommand = WebhookIdentity & {
    readonly action: string;
    readonly subscriptionId: string | null;
    readonly projection: SubscriptionProjection | null;
};

export type BillingWebhookResult = {
    readonly eventId: string;
    readonly outcome: string;
};

export type BillingWebhookPersistence = {
    readonly apply: (command: BillingWebhookCommand) => Promise<BillingWebhookResult>;
};

export type StripeWebhookDependencies = {
    readonly readWebhookSecret: () => string | null;
    readonly verifyEvent: (payload: string, signature: string, secret: string) => Stripe.Event;
    readonly retrieveSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>;
    readonly persistence: BillingWebhookPersistence;
    readonly reportFailure: (error: unknown) => void;
};
