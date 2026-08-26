import type { Prisma, PrismaClient } from '@prisma/client';
import billingContract from '../../../data/contracts/billing.json';
import { matchNullable } from '@/components/fp/result';
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
    return direct ?? (await transaction.subscription.findUnique({
        where: { stripeSubscriptionId: projection.subscriptionId },
        include: { user: true },
    }))?.user ?? null;
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
    return matchNullable(user, {
        nothing: () => Promise.resolve(false),
        present: async (presentUser) => {
            const plan = findBillingPlan(projection.planKey);
            await transaction.user.update({
                where: { id: presentUser.id },
                data: {
                    stripeCustomerId: projection.customerId,
                    plan: plan?.key ?? presentUser.plan,
                },
            });
            await transaction.subscription.upsert({
                where: { userId: presentUser.id },
                create: {
                    userId: presentUser.id,
                    ...subscriptionValues(projection),
                },
                update: subscriptionValues(projection),
            });
            return true;
        },
    });
};

const cancelSubscription = async (
    transaction: BillingTransaction,
    projection: SubscriptionProjection,
): Promise<boolean> => {
    const user = await resolveProjectionUser(transaction, projection);
    return matchNullable(user, {
        nothing: () => Promise.resolve(false),
        present: async (presentUser) => {
            const canceledProjection = {
                ...projection,
                status: billingContract.statuses.canceled,
                cancelAtPeriodEnd: billingContract.cancellation.cancelAtPeriodEnd,
            };
            await transaction.user.update({
                where: { id: presentUser.id },
                data: {
                    stripeCustomerId: projection.customerId,
                    plan: defaultBillingPlan().key,
                },
            });
            await transaction.subscription.upsert({
                where: { userId: presentUser.id },
                create: {
                    userId: presentUser.id,
                    ...subscriptionValues(canceledProjection),
                },
                update: subscriptionValues(canceledProjection),
            });
            return true;
        },
    });
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

const applyProjectionEffect = async (
    transaction: BillingTransaction,
    command: BillingWebhookCommand,
): Promise<boolean> => matchNullable(command.projection, {
    nothing: () => Promise.resolve(false),
    present: (projection) => matchNullable(projectionEffects[command.action], {
        nothing: () => Promise.resolve(false),
        present: (effect) => effect(transaction, projection),
    }),
});

const applyCurrentEvent = async (
    transaction: BillingTransaction,
    command: BillingWebhookCommand,
): Promise<BillingWebhookResult> => {
    const newerEvent = command.subscriptionId
        ? await transaction.stripeWebhookEvent.findFirst({
            where: {
                subscriptionId: command.subscriptionId,
                eventCreatedAt: { gt: command.eventCreatedAt },
            },
        })
        : null;
    return matchNullable(newerEvent, {
        present: () => recordOutcome(
            transaction,
            command,
            billingContract.outcomes.stale,
        ),
        nothing: async () => recordOutcome(
            transaction,
            command,
            await applyProjectionEffect(transaction, command)
                ? billingContract.outcomes.applied
                : billingContract.outcomes.ignored,
        ),
    });
};

const applyInTransaction = async (
    transaction: BillingTransaction,
    command: BillingWebhookCommand,
): Promise<BillingWebhookResult> => {
    const duplicate = await transaction.stripeWebhookEvent.findUnique({
        where: { id: command.eventId },
    });
    return matchNullable(duplicate, {
        present: () => Promise.resolve({
            eventId: command.eventId,
            outcome: billingContract.outcomes.duplicate,
        }),
        nothing: () => applyCurrentEvent(transaction, command),
    });
};

export const createPrismaBillingWebhookPersistence = (
    prisma: PrismaClient,
): BillingWebhookPersistence => ({
    apply: (command) => prisma.$transaction((transaction) =>
        applyInTransaction(transaction, command)),
});
