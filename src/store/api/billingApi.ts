import { baseApi } from './index';
import billingContract from '../../../data/contracts/billing.json';
import type {
    BillingDocument,
    CheckoutRequest,
    RedirectDocument,
} from '@/entities/billing/billingTypes';

export const billingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBilling: builder.query<BillingDocument, void>({
            query: () => billingContract.routes.billing,
            providesTags: ['Billing'],
        }),
        createCheckout: builder.mutation<RedirectDocument, CheckoutRequest>({
            query: (plan) => ({
                url: billingContract.routes.billing,
                method: billingContract.methods.create,
                body: plan,
            }),
            invalidatesTags: ['Billing'],
        }),
        openPortal: builder.mutation<RedirectDocument, void>({
            query: () => ({
                url: billingContract.routes.portal,
                method: billingContract.methods.create,
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
