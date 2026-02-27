import { baseApi } from './index';

export const billingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBilling: builder.query({
            query: () => 'api/billing',
            providesTags: ['Billing'],
        }),
        createCheckout: builder.mutation({
            query: (plan) => ({
                url: 'api/billing',
                method: 'POST',
                body: plan,
            }),
            invalidatesTags: ['Billing'],
        }),
        openPortal: builder.mutation({
            query: () => ({
                url: 'api/billing/portal',
                method: 'POST',
            }),
            invalidatesTags: ['Billing'],
        }),
    }),
});

export const {
    useGetBillingQuery,
    useCreateCheckoutMutation,
    useOpenPortalMutation,
} = billingApi;
