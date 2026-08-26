import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import billingContract from '../../../../data/contracts/billing.json';
import fixture from '../../../../data/tests/billing-webhooks.json';
import {
    hydrateCheckout,
    instructionToCommand,
    projectStripeEvent,
} from '@/components/billing/stripeEventProjection';

const subscription = (status = fixture.subscription.status): Stripe.Subscription => ({
    id: fixture.subscription.id,
    object: billingContract.objects.subscription,
    customer: fixture.subscription.customerId,
    metadata: {
        userId: fixture.user.id,
        planKey: fixture.subscription.planKey,
    },
    status,
    cancel_at_period_end: false,
    items: {
        data: [{
            price: { id: fixture.subscription.priceId },
            current_period_start: fixture.subscription.currentPeriodStart,
            current_period_end: fixture.subscription.currentPeriodEnd,
        }],
    },
} as unknown as Stripe.Subscription);

const event = (
    id: string,
    type: string,
    created: number,
    object: unknown,
): Stripe.Event => ({ id, type, created, data: { object } } as Stripe.Event);

describe(fixture.cases.projection, () => {
    it(fixture.cases.checkout, () => {
        const checkoutEvent = event(
            fixture.events.checkout.id,
            billingContract.events.checkoutCompleted,
            fixture.events.checkout.created,
            {
                object: billingContract.objects.checkoutSession,
                subscription: fixture.subscription.id,
                customer: fixture.subscription.customerId,
                metadata: {
                    userId: fixture.user.id,
                    planKey: fixture.subscription.planKey,
                },
            },
        );

        const instruction = projectStripeEvent(checkoutEvent);
        expect(instruction.kind).toBe('hydrate-checkout');
        if (instruction.kind !== 'hydrate-checkout') {
            return;
        }

        const command = hydrateCheckout(instruction, subscription());
        expect(command.action).toBe(billingContract.actions.upsert);
        expect(command.projection?.planKey).toBe(fixture.subscription.planKey);
        expect(command.subscriptionId).toBe(fixture.subscription.id);
    });

    it(fixture.cases.update, () => {
        const update = projectStripeEvent(event(
            fixture.events.newerUpdate.id,
            billingContract.events.subscriptionUpdated,
            fixture.events.newerUpdate.created,
            subscription(fixture.events.newerUpdate.status),
        ));

        expect(update.kind).toBe('apply-subscription');
        if (update.kind !== 'apply-subscription') {
            return;
        }

        const command = instructionToCommand(update);
        expect(command.action).toBe(billingContract.actions.upsert);
        expect(command.projection?.status).toBe(fixture.events.newerUpdate.status);
    });

    it(fixture.cases.unknown, () => {
        const unknown = projectStripeEvent(event(
            fixture.events.unknown.id,
            fixture.events.unknown.type,
            fixture.events.unknown.created,
            {},
        ));

        expect(unknown.kind).toBe('ignore');
        if (unknown.kind !== 'ignore') {
            return;
        }
        expect(instructionToCommand(unknown).subscriptionId).toBeNull();
    });
});
