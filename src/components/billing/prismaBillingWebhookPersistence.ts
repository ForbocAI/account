import type { Prisma, PrismaClient } from '@prisma/client';
import billingContract from '../../../data/contracts/billing.json';
import { defaultBillingPlan, findBillingPlan } from '@/components/billing/billingCatalog';
import type {
    BillingWebhookCommand,
    BillingWebhookPersistence,
    BillingWebhookResult,
    SubscriptionProjection,
} from '@/entities/billing/billingTypes';

type BillingTransaction = Prisma.TransactionClient;

const resolveProjectionUser = async (
    transaction: BillingTransaction,
    projection: SubscriptionProjection,
) => {
    const direct = projection.userId
        ? await transaction.user.findUnique({ where: { id: projection.userId } })
        : await transaction.user.findUnique({ where: { stripeCustomerId: projection.customerId } });
    if (direct) {
        return direct;
    }

    const subscription = await transaction.subscription.findUnique({
        where: { stripeSubscriptionId: projection.subscriptionId },
        include: { user: true },
    });
    return subscription?.user ?? null;
};

const subscriptionValues = (projection: SubscriptionProjection) => ({
    stripeSubscriptionId: projection.subscriptionId,
    stripePriceId: projection.priceId,
    status: projection.status,
    currentPeriodStart: projection.currentPeriodStart,
    currentPeriodEnd: projection.currentPeriodEnd,
    cancelAtPeriodEnd: projection.cancelAtPeriodEnd,
});

const upsertSubscription = async (
    transaction: BillingTransaction,
    projection: SubscriptionProjection,
): Promise<boolean> => {
    const user = await resolveProjectionUser(transaction, projection);
    if (!user) {
        return false;
    }

    const plan = findBillingPlan(projection.planKey);
    await transaction.user.update({
        where: { id: user.id },
        data: {
            stripeCustomerId: projection.customerId,
            plan: plan?.key ?? user.plan,
        },
    });
    await transaction.subscription.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            ...subscriptionValues(projection),
        },
        update: subscriptionValues(projection),
    });
    return true;
};

const cancelSubscription = async (
    transaction: BillingTransaction,
    projection: SubscriptionProjection,
): Promise<boolean> => {
    const user = await resolveProjectionUser(transaction, projection);
    if (!user) {
        return false;
    }

    const canceledProjection = {
        ...projection,
        status: billingContract.statuses.canceled,
        cancelAtPeriodEnd: false,
    };
    await transaction.user.update({
        where: { id: user.id },
        data: {
            stripeCustomerId: projection.customerId,
            plan: defaultBillingPlan().key,
        },
    });
    await transaction.subscription.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            ...subscriptionValues(canceledProjection),
        },
        update: subscriptionValues(canceledProjection),
    });
    return true;
};

type ProjectionEffect = (
    transaction: BillingTransaction,
    projection: SubscriptionProjection,
) => Promise<boolean>;

const projectionEffects: Readonly<Partial<Record<string, ProjectionEffect>>> = {
    [billingContract.actions.upsert]: upsertSubscription,
    [billingContract.actions.cancel]: cancelSubscription,
};

const recordOutcome = async (
    transaction: BillingTransaction,
    command: BillingWebhookCommand,
    outcome: string,
): Promise<BillingWebhookResult> => {
    await transaction.stripeWebhookEvent.create({
        data: {
            id: command.eventId,
            eventType: command.eventType,
            eventCreatedAt: command.eventCreatedAt,
            subscriptionId: command.subscriptionId,
            outcome,
        },
    });
    return { eventId: command.eventId, outcome };
};

const applyInTransaction = async (
    transaction: BillingTransaction,
    command: BillingWebhookCommand,
): Promise<BillingWebhookResult> => {
    const duplicate = await transaction.stripeWebhookEvent.findUnique({
        where: { id: command.eventId },
    });
    if (duplicate) {
        return { eventId: command.eventId, outcome: billingContract.outcomes.duplicate };
    }

    const newerEvent = command.subscriptionId
        ? await transaction.stripeWebhookEvent.findFirst({
            where: {
                subscriptionId: command.subscriptionId,
                eventCreatedAt: { gt: command.eventCreatedAt },
            },
        })
        : null;
    if (newerEvent) {
        return recordOutcome(transaction, command, billingContract.outcomes.stale);
    }

    const effect = projectionEffects[command.action];
    const applied = effect && command.projection
        ? await effect(transaction, command.projection)
        : false;
    return recordOutcome(
        transaction,
        command,
        applied ? billingContract.outcomes.applied : billingContract.outcomes.ignored,
    );
};

export const createPrismaBillingWebhookPersistence = (
    prisma: PrismaClient,
): BillingWebhookPersistence => ({
    apply: (command) => prisma.$transaction((transaction) =>
        applyInTransaction(transaction, command)),
});
