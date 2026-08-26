import billingContract from '../../../data/contracts/billing.json';
import httpContract from '../../../data/contracts/http.json';
import { attempt, attemptSync, matchResult } from '@/components/fp/result';
import {
    hydrateCheckout,
    instructionToCommand,
    projectStripeEvent,
} from '@/components/billing/stripeEventProjection';
import type {
    BillingWebhookCommand,
    StripeWebhookDependencies,
    StripeWebhookInstruction,
} from '@/entities/billing/billingTypes';

type StripeWebhookRoute = (request: Request) => Promise<Response>;

const json = (body: unknown, status: number): Response => Response.json(body, { status });

const prepareCommand = (
    instruction: StripeWebhookInstruction,
    dependencies: StripeWebhookDependencies,
): Promise<BillingWebhookCommand> => instruction.kind === 'hydrate-checkout'
    ? dependencies.retrieveSubscription(instruction.subscriptionId)
        .then((subscription) => hydrateCheckout(instruction, subscription))
    : Promise.resolve(instructionToCommand(instruction));

export const createStripeWebhookRoute = (
    dependencies: StripeWebhookDependencies,
): StripeWebhookRoute => async (request) => {
    const secret = dependencies.readWebhookSecret();
    const signature = request.headers.get(billingContract.headers.stripeSignature);
    return !secret || !signature
        ? json(
            { error: billingContract.messages.missingSignature },
            httpContract.status.badRequest,
        )
        : request.text().then((payload) => matchResult(
            attemptSync(() => dependencies.verifyEvent(payload, signature, secret)), {
        failure: async () => json(
            { error: billingContract.messages.invalidSignature },
            httpContract.status.badRequest,
        ),
        success: async (event) => matchResult(await attempt(async () => {
            const command = await prepareCommand(projectStripeEvent(event), dependencies);
            return dependencies.persistence.apply(command);
        }), {
            failure: (error) => {
                dependencies.reportFailure(error);
                return json(
                    { error: billingContract.messages.processingFailed },
                    httpContract.status.internalServerError,
                );
            },
            success: (result) => json(
                { received: true, outcome: result.outcome },
                httpContract.status.ok,
            ),
        }),
    }));
};
