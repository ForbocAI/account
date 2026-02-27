import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

/**
 * Plans available in the Forboc AI billing system.
 * Prices are created in the Stripe Dashboard; IDs are stored in env vars.
 */
export const PLANS = {
    free: {
        name: 'Initiate',
        requestsPerDay: 1_000,
        priceId: null, // Free tier — no Stripe price
    },
    pro: {
        name: 'Operative',
        requestsPerDay: 50_000,
        priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    },
    enterprise: {
        name: 'Architect',
        requestsPerDay: -1, // unlimited
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
    },
} as const;

export type PlanKey = keyof typeof PLANS;
