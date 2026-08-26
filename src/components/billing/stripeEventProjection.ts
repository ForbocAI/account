import type Stripe from 'stripe';
import billingContract from '../../../data/contracts/billing.json';
import { findPlanByPriceId } from '@/components/billing/billingCatalog';
import type {
    ApplySubscriptionInstruction,
    BillingWebhookCommand,
    HydrateCheckoutInstruction,
    IgnoreWebhookInstruction,
    StripeWebhookInstruction,
    SubscriptionProjection,
} from '@/entities/billing/billingTypes';

type EventHandler = (event: Stripe.Event) => StripeWebhookInstruction;

const eventDate = (event: Stripe.Event): Date => new Date(
    event.created * billingContract.time.millisecondsPerSecond,
);

const objectId = (value: string | { readonly id: string } | null): string | null =>
    typeof value === 'string' ? value : value?.id ?? null;

const ignore = (event: Stripe.Event): IgnoreWebhookInstruction => ({
    kind: 'ignore',
    eventId: event.id,
    eventType: event.type,
    eventCreatedAt: eventDate(event),
});

const projectSubscription = (subscription: Stripe.Subscription): SubscriptionProjection | null => {
    const item = subscription.items.data[billingContract.sequence.firstIndex];
    const customerId = objectId(subscription.customer);
    return item && customerId ? {
        subscriptionId: subscription.id,
        customerId,
        userId: subscription.metadata.userId ?? null,
        planKey: subscription.metadata.planKey
            ?? findPlanByPriceId(item.price.id)?.key
            ?? null,
        priceId: item.price.id,
        status: subscription.status,
        currentPeriodStart: new Date(
            item.current_period_start * billingContract.time.millisecondsPerSecond,
        ),
        currentPeriodEnd: new Date(
            item.current_period_end * billingContract.time.millisecondsPerSecond,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } : null;
};

const checkoutCompleted = (event: Stripe.Event): StripeWebhookInstruction => {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = objectId(session.subscription);
    const customerId = objectId(session.customer);
    const userId = session.metadata?.userId;
    const planKey = session.metadata?.planKey;
    return subscriptionId && customerId && userId && planKey
        ? {
            kind: 'hydrate-checkout',
            eventId: event.id,
            eventType: event.type,
            eventCreatedAt: eventDate(event),
            subscriptionId,
            customerId,
            userId,
            planKey,
        }
        : ignore(event);
};

const subscriptionInstruction = (
    event: Stripe.Event,
    action: string,
): StripeWebhookInstruction => {
    const projection = projectSubscription(event.data.object as Stripe.Subscription);
    return projection
        ? {
            kind: 'apply-subscription',
            eventId: event.id,
            eventType: event.type,
            eventCreatedAt: eventDate(event),
            action,
            projection,
        }
        : ignore(event);
};

const handlers: Readonly<Record<string, EventHandler>> = {
    [billingContract.events.checkoutCompleted]: checkoutCompleted,
    [billingContract.events.subscriptionUpdated]: (event) =>
        subscriptionInstruction(event, billingContract.actions.upsert),
    [billingContract.events.subscriptionDeleted]: (event) =>
        subscriptionInstruction(event, billingContract.actions.cancel),
};

export const projectStripeEvent = (event: Stripe.Event): StripeWebhookInstruction =>
    (handlers[event.type] ?? ignore)(event);

export const hydrateCheckout = (
    instruction: HydrateCheckoutInstruction,
    subscription: Stripe.Subscription,
): BillingWebhookCommand => {
    const projection = projectSubscription(subscription);
    return projection
        ? {
            eventId: instruction.eventId,
            eventType: instruction.eventType,
            eventCreatedAt: instruction.eventCreatedAt,
            action: billingContract.actions.upsert,
            subscriptionId: instruction.subscriptionId,
            projection: {
                ...projection,
                customerId: instruction.customerId,
                userId: instruction.userId,
                planKey: instruction.planKey,
            },
        }
        : {
            eventId: instruction.eventId,
            eventType: instruction.eventType,
            eventCreatedAt: instruction.eventCreatedAt,
            action: billingContract.actions.ignore,
            subscriptionId: instruction.subscriptionId,
            projection: null,
        };
};

export const instructionToCommand = (
    instruction: ApplySubscriptionInstruction | IgnoreWebhookInstruction,
): BillingWebhookCommand => instruction.kind === 'apply-subscription'
    ? {
        eventId: instruction.eventId,
        eventType: instruction.eventType,
        eventCreatedAt: instruction.eventCreatedAt,
        action: instruction.action,
        subscriptionId: instruction.projection.subscriptionId,
        projection: instruction.projection,
    }
    : {
        eventId: instruction.eventId,
        eventType: instruction.eventType,
        eventCreatedAt: instruction.eventCreatedAt,
        action: billingContract.actions.ignore,
        subscriptionId: null,
        projection: null,
    };
