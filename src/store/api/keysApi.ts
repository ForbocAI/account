import { baseApi } from './index';

export const keysApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getKeys: builder.query({
            query: () => 'api/keys',
            providesTags: ['ApiKey'],
        }),
        createKey: builder.mutation({
            query: (key) => ({
                url: 'api/keys',
                method: 'POST',
                body: key,
            }),
            invalidatesTags: ['ApiKey'],
        }),
        revokeKey: builder.mutation({
            query: (id) => ({
                url: `api/keys/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ApiKey'],
        }),
    }),
});

export const {
    useGetKeysQuery,
    useCreateKeyMutation,
    useRevokeKeyMutation,
} = keysApi;
