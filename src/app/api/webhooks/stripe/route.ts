import billingContract from '../../../../../data/contracts/billing.json';
import { createPrismaBillingWebhookPersistence } from '@/components/billing/prismaBillingWebhookPersistence';
import { getStripe } from '@/components/billing/stripeClient';
import { prisma } from '@/lib/db';
import { createStripeWebhookRoute } from '@/systems/billing/stripeWebhookRoutes';

const postWebhook = createStripeWebhookRoute({
    readWebhookSecret: () => process.env[billingContract.environment.webhookSecret] ?? null,
    verifyEvent: (payload, signature, secret) =>
        getStripe().webhooks.constructEvent(payload, signature, secret),
    retrieveSubscription: (subscriptionId) =>
        getStripe().subscriptions.retrieve(subscriptionId),
    persistence: createPrismaBillingWebhookPersistence(prisma),
    reportFailure: (error) => console.error(billingContract.messages.processingFailed, error),
});

export const POST = (request: Request): Promise<Response> => postWebhook(request);
