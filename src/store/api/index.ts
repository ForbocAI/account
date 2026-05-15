import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API slice for all account portal requests
export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    tagTypes: ['User', 'ApiKey', 'Billing'],
    endpoints: () => ({}),
});
