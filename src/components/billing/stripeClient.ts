import Stripe from 'stripe';
import billingContract from '../../../data/contracts/billing.json';
import { matchNullable } from '@/components/fp/result';

const stripeGlobal = globalThis as unknown as { accountStripe?: Stripe };

export const getStripe = (): Stripe => matchNullable(
    process.env[billingContract.environment.stripeSecret],
    {
        nothing: () => {
            throw new Error(`${billingContract.environment.stripeSecret} is not set`);
        },
        present: (secret) => {
            stripeGlobal.accountStripe ??= new Stripe(secret, { typescript: true });
            return stripeGlobal.accountStripe;
        },
    },
);
