import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import billingContract from '../../../../data/contracts/billing.json';
import httpContract from '../../../../data/contracts/http.json';
import fixture from '../../../../data/tests/billing-webhooks.json';
import type {
    BillingWebhookCommand,
    StripeWebhookDependencies,
} from '@/entities/billing/billingTypes';
import { createStripeWebhookRoute } from '@/systems/billing/stripeWebhookRoutes';

const checkoutEvent = {
    id: fixture.events.checkout.id,
    type: billingContract.events.checkoutCompleted,
    created: fixture.events.checkout.created,
    data: {
        object: {
            object: billingContract.objects.checkoutSession,
            subscription: fixture.subscription.id,
            customer: fixture.subscription.customerId,
            metadata: {
                userId: fixture.user.id,
                planKey: fixture.subscription.planKey,
            },
        },
    },
} as unknown as Stripe.Event;

const subscription = {
    id: fixture.subscription.id,
    object: billingContract.objects.subscription,
    customer: fixture.subscription.customerId,
    metadata: {
        userId: fixture.user.id,
        planKey: fixture.subscription.planKey,
    },
    status: fixture.subscription.status,
    cancel_at_period_end: false,
    items: {
        data: [{
            price: { id: fixture.subscription.priceId },
            current_period_start: fixture.subscription.currentPeriodStart,
            current_period_end: fixture.subscription.currentPeriodEnd,
        }],
    },
} as unknown as Stripe.Subscription;

const request = (signature?: string): Request => new Request(fixture.requestUrl, {
    method: billingContract.methods.create,
    headers: signature ? { [fixture.signatureHeader]: signature } : undefined,
});

const dependencies = (
    commands: BillingWebhookCommand[],
    apply: StripeWebhookDependencies['persistence']['apply'] = async (command) => {
        commands.push(command);
        return { eventId: command.eventId, outcome: billingContract.outcomes.applied };
    },
): StripeWebhookDependencies => ({
    readWebhookSecret: () => fixture.secret,
    verifyEvent: (_payload, signature) => {
        if (signature !== fixture.signature) {
            throw new Error(fixture.failure);
        }
        return checkoutEvent;
    },
    retrieveSubscription: async () => subscription,
    persistence: { apply },
    reportFailure: () => undefined,
});

describe(fixture.cases.routes, () => {
    it(fixture.cases.valid, async () => {
        const commands: BillingWebhookCommand[] = [];
        const response = await createStripeWebhookRoute(dependencies(commands))(
            request(fixture.signature),
        );

        expect(response.status).toBe(httpContract.status.ok);
        expect(commands).toHaveLength(billingContract.checkout.quantity);
        expect(commands[0].eventId).toBe(fixture.events.checkout.id);
    });

    it(fixture.cases.missingSignature, async () => {
        const response = await createStripeWebhookRoute(dependencies([]))(request());
        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: billingContract.messages.missingSignature });
    });

    it(fixture.cases.invalidSignature, async () => {
        const response = await createStripeWebhookRoute(dependencies([]))(
            request(fixture.invalidSignature),
        );
        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: billingContract.messages.invalidSignature });
    });

    it(fixture.cases.transactionFailure, async () => {
        const reject = async (): Promise<never> => Promise.reject(new Error(fixture.failure));
        const response = await createStripeWebhookRoute(dependencies([], reject))(
            request(fixture.signature),
        );
        expect(response.status).toBe(httpContract.status.internalServerError);
        expect(await response.json()).toEqual({ error: billingContract.messages.processingFailed });
    });
});
