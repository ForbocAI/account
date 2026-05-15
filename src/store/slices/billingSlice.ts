import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

interface BillingState {
    plan: string;
    planName: string;
    requestsPerDay: number;
    subscription: {
        status: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
    } | null;
    isLoading: boolean;
}

const initialState: BillingState = {
    plan: 'free',
    planName: 'Initiate',
    requestsPerDay: 1_000,
    subscription: null,
    isLoading: false,
};

export const billingSlice = createSlice({
    name: 'billing',
    initialState,
    reducers: {
        setBilling: (state, action: PayloadAction<Omit<BillingState, 'isLoading'>>) => {
            state.plan = action.payload.plan;
            state.planName = action.payload.planName;
            state.requestsPerDay = action.payload.requestsPerDay;
            state.subscription = action.payload.subscription;
        },
        setBillingLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setBilling, setBillingLoading } = billingSlice.actions;

// Selectors
const selectBillingState = (state: { billing: BillingState }) => state.billing;

export const selectBilling = createSelector(selectBillingState, (state) => state);
export const selectBillingPlan = createSelector(selectBillingState, (state) => state.plan as string);
export const selectBillingPlanName = createSelector(selectBillingState, (state) => state.planName as string);
export const selectBillingRequestsPerDay = createSelector(selectBillingState, (state) => state.requestsPerDay as number);
export const selectSubscription = createSelector(selectBillingState, (state) => state.subscription);
export const selectIsBillingLoading = createSelector(selectBillingState, (state) => state.isLoading as boolean);

export default billingSlice.reducer;
