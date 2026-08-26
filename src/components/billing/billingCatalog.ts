import billingContract from '../../../data/contracts/billing.json';
import type { BillingPlan } from '@/entities/billing/billingTypes';

export const billingPlans: readonly BillingPlan[] = billingContract.plans;

const planByKey = billingPlans.reduce<Record<string, BillingPlan>>(
    (catalog, plan) => ({ ...catalog, [plan.key]: plan }),
    {},
);

export const defaultBillingPlan = (): BillingPlan => planByKey[billingContract.defaultPlan];

export const findBillingPlan = (key: unknown): BillingPlan | null =>
    typeof key === 'string' ? planByKey[key] ?? null : null;

export const readPlanPriceId = (plan: BillingPlan): string | null =>
    plan.priceEnvironment ? process.env[plan.priceEnvironment] ?? null : null;

export const findPlanByPriceId = (priceId: string): BillingPlan | null =>
    billingPlans.find((plan) => readPlanPriceId(plan) === priceId) ?? null;
