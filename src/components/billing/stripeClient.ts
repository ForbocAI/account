import Stripe from 'stripe';
import billingContract from '../../../data/contracts/billing.json';

const stripeGlobal = globalThis as unknown as { accountStripe?: Stripe };

export const getStripe = (): Stripe => {
    const secret = process.env[billingContract.environment.stripeSecret];
    if (!secret) {
        throw new Error(`${billingContract.environment.stripeSecret} is not set`);
    }

    stripeGlobal.accountStripe ??= new Stripe(secret, { typescript: true });
    return stripeGlobal.accountStripe;
};
