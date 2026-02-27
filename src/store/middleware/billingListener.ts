import { createListenerMiddleware } from '@reduxjs/toolkit';
import { billingApi } from '../api/billingApi';
import { setBilling } from '../slices/billingSlice';

export const billingListener = createListenerMiddleware();

billingListener.startListening({
    matcher: billingApi.endpoints.getBilling.matchFulfilled,
    effect: (action, listenerApi) => {
        // Sync API data to the billing slice
        listenerApi.dispatch(setBilling(action.payload));
    },
});
