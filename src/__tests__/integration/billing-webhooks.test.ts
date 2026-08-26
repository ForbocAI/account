import Stripe from 'stripe';
import { beforeEach, describe, expect, it } from 'vitest';
import billingContract from '../../../data/contracts/billing.json';
import httpContract from '../../../data/contracts/http.json';
import fixture from '../../../data/tests/billing-webhooks.json';
import { createPrismaBillingWebhookPersistence } from '@/components/billing/prismaBillingWebhookPersistence';
import type { StripeWebhookDependencies } from '@/entities/billing/billingTypes';
import { createStripeWebhookRoute } from '@/systems/billing/stripeWebhookRoutes';
import { prisma } from './setup';

const stripe = new Stripe(fixture.apiSecret, { typescript: true });

const subscriptionObject = (status: string) => ({
    id: fixture.subscription.id,
    object: billingContract.objects.subscription,
    customer: fixture.subscription.customerId,
    metadata: {
        userId: fixture.user.id,
        planKey: fixture.subscription.planKey,
    },
    status,
    cancel_at_period_end: fixture.subscription.cancelAtPeriodEnd,
    items: {
        data: [{
            price: { id: fixture.subscription.priceId },
            current_period_start: fixture.subscription.currentPeriodStart,
            current_period_end: fixture.subscription.currentPeriodEnd,
        }],
    },
});

const checkoutObject = {
    object: billingContract.objects.checkoutSession,
    subscription: fixture.subscription.id,
    customer: fixture.subscription.customerId,
    metadata: {
        userId: fixture.user.id,
        planKey: fixture.subscription.planKey,
    },
};

const eventPayload = (
    id: string,
    type: string,
    created: number,
    object: unknown,
) => JSON.stringify({ id, type, created, data: { object } });

const request = (payload: string): Request => new Request(fixture.requestUrl, {
    method: billingContract.methods.create,
    headers: {
        [fixture.signatureHeader]: stripe.webhooks.generateTestHeaderString({
            payload,
            secret: fixture.secret,
        }),
    },
    body: payload,
});

const routeDependencies: StripeWebhookDependencies = {
    readWebhookSecret: () => fixture.secret,
    verifyEvent: (payload, signature, secret) =>
        stripe.webhooks.constructEvent(payload, signature, secret),
    retrieveSubscription: async () => subscriptionObject(
        fixture.subscription.status,
    ) as unknown as Stripe.Subscription,
    persistence: createPrismaBillingWebhookPersistence(prisma),
    reportFailure: () => undefined,
};

const route = createStripeWebhookRoute(routeDependencies);

const deliver = (
    id: string,
    type: string,
    created: number,
    object: unknown,
) => route(request(eventPayload(id, type, created, object)));

beforeEach(async () => {
    await prisma.user.create({
        data: {
            id: fixture.user.id,
            email: fixture.user.email,
            passwordHash: fixture.user.passwordHash,
            stripeCustomerId: fixture.subscription.customerId,
        },
    });
});

describe(fixture.cases.database, () => {
    it(fixture.cases.duplicate, async () => {
        const deliverCheckout = () => deliver(
            fixture.events.checkout.id,
            billingContract.events.checkoutCompleted,
            fixture.events.checkout.created,
            checkoutObject,
        );

        expect((await deliverCheckout()).status).toBe(httpContract.status.ok);
        expect((await deliverCheckout()).status).toBe(httpContract.status.ok);
        expect(await prisma.stripeWebhookEvent.count()).toBe(billingContract.checkout.quantity);
        expect(await prisma.subscription.count()).toBe(billingContract.checkout.quantity);
    });

    it(fixture.cases.outOfOrderUpdate, async () => {
        await deliver(
            fixture.events.checkout.id,
            billingContract.events.checkoutCompleted,
            fixture.events.checkout.created,
            checkoutObject,
        );
        await deliver(
            fixture.events.newerUpdate.id,
            billingContract.events.subscriptionUpdated,
            fixture.events.newerUpdate.created,
            subscriptionObject(fixture.events.newerUpdate.status),
        );
        await deliver(
            fixture.events.olderUpdate.id,
            billingContract.events.subscriptionUpdated,
            fixture.events.olderUpdate.created,
            subscriptionObject(fixture.events.olderUpdate.status),
        );

        const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: fixture.subscription.id },
        });
        const staleEvent = await prisma.stripeWebhookEvent.findUnique({
            where: { id: fixture.events.olderUpdate.id },
        });
        expect(subscription?.status).toBe(fixture.events.newerUpdate.status);
        expect(staleEvent?.outcome).toBe(billingContract.outcomes.stale);
    });

    it(fixture.cases.outOfOrderDelete, async () => {
        await deliver(
            fixture.events.delete.id,
            billingContract.events.subscriptionDeleted,
            fixture.events.delete.created,
            subscriptionObject(fixture.subscription.status),
        );
        await deliver(
            fixture.events.checkout.id,
            billingContract.events.checkoutCompleted,
            fixture.events.checkout.created,
            checkoutObject,
        );

        const user = await prisma.user.findUnique({ where: { id: fixture.user.id } });
        const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: fixture.subscription.id },
        });
        expect(user?.plan).toBe(billingContract.defaultPlan);
        expect(subscription?.status).toBe(billingContract.statuses.canceled);
    });

    it(fixture.cases.unknownDatabase, async () => {
        expect((await deliver(
            fixture.events.unknown.id,
            fixture.events.unknown.type,
            fixture.events.unknown.created,
            {},
        )).status).toBe(httpContract.status.ok);

        const event = await prisma.stripeWebhookEvent.findUnique({
            where: { id: fixture.events.unknown.id },
        });
        expect(event?.outcome).toBe(billingContract.outcomes.ignored);
        expect(await prisma.subscription.count()).toBe(fixture.counts.none);
    });
});
