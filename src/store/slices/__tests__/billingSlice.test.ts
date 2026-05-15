import { describe, it, expect } from 'vitest';
import billingReducer, { setBilling, setBillingLoading } from '../billingSlice';

describe('billingSlice', () => {
    const initialState = {
        plan: 'free',
        planName: 'Initiate',
        requestsPerDay: 1000,
        subscription: null,
        isLoading: false,
    };

    it('should handle initial state', () => {
        expect(billingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('Given initial billing state', () => {
        describe('When setBilling is dispatched', () => {
            it('Then it should update all billing fields', () => {
                const newBilling = {
                    plan: 'pro',
                    planName: 'Elite',
                    requestsPerDay: 10000,
                    subscription: {
                        status: 'active',
                        currentPeriodEnd: '2026-03-26',
                        cancelAtPeriodEnd: false,
                    }
                };
                const nextState = billingReducer(initialState, setBilling(newBilling));

                expect(nextState.plan).toBe('pro');
                expect(nextState.planName).toBe('Elite');
                expect(nextState.requestsPerDay).toBe(10000);
                expect(nextState.subscription).toEqual(newBilling.subscription);
            });
        });

        describe('When setBillingLoading is dispatched', () => {
            it('Then it should update isLoading state', () => {
                const nextState = billingReducer(initialState, setBillingLoading(true));
                expect(nextState.isLoading).toBe(true);
            });
        });
    });
});
