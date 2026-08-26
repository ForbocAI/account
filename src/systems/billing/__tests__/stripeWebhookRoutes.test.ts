import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import billingContract from '../../../../data/contracts/billing.json';
import httpContract from '../../../../data/contracts/http.json';
import fixture from '../../../../data/tests/billing-webhooks.json';
import type {
    BillingWebhookCommand,
    BillingWebhookResult,
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
    cancel_at_period_end: fixture.subscription.cancelAtPeriodEnd,
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

type CommandLedger = { commands: readonly BillingWebhookCommand[] };

const emptyLedger = (): CommandLedger => ({ commands: [] });

const invalidSignature = (): never => {
    throw new Error(fixture.failure);
};

const dependencies = (
    ledger: CommandLedger,
    apply: (command: BillingWebhookCommand) => Promise<BillingWebhookResult> = async (command) => {
        ledger.commands = [...ledger.commands, command];
        return { eventId: command.eventId, outcome: billingContract.outcomes.applied };
    },
): StripeWebhookDependencies => ({
    readWebhookSecret: () => fixture.secret,
    verifyEvent: (_payload, signature) => signature === fixture.signature
        ? checkoutEvent
        : invalidSignature(),
    retrieveSubscription: async () => subscription,
    persistence: { apply },
    reportFailure: () => undefined,
});

describe(fixture.cases.routes, () => {
    it(fixture.cases.valid, async () => {
        const ledger = emptyLedger();
        const response = await createStripeWebhookRoute(dependencies(ledger))(
            request(fixture.signature),
        );

        expect(response.status).toBe(httpContract.status.ok);
        expect(ledger.commands).toHaveLength(billingContract.checkout.quantity);
        expect(ledger.commands.at(fixture.sequence.firstIndex)?.eventId).toBe(
            fixture.events.checkout.id,
        );
    });

    it(fixture.cases.missingSignature, async () => {
        const response = await createStripeWebhookRoute(dependencies(emptyLedger()))(request());
        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: billingContract.messages.missingSignature });
    });

    it(fixture.cases.invalidSignature, async () => {
        const response = await createStripeWebhookRoute(dependencies(emptyLedger()))(
            request(fixture.invalidSignature),
        );
        expect(response.status).toBe(httpContract.status.badRequest);
        expect(await response.json()).toEqual({ error: billingContract.messages.invalidSignature });
    });

    it(fixture.cases.transactionFailure, async () => {
        const reject = async (): Promise<never> => Promise.reject(new Error(fixture.failure));
        const response = await createStripeWebhookRoute(dependencies(emptyLedger(), reject))(
            request(fixture.signature),
        );
        expect(response.status).toBe(httpContract.status.internalServerError);
        expect(await response.json()).toEqual({ error: billingContract.messages.processingFailed });
    });
});
