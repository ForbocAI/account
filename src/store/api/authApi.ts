import { baseApi } from './index';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: 'api/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),
        signup: builder.mutation({
            query: (user) => ({
                url: 'api/auth/signup',
                method: 'POST',
                body: user,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.mutation({
            query: () => ({
                url: 'api/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
        getMe: builder.query({
            query: () => 'api/auth/me',
            providesTags: ['User'],
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetMeQuery,
} = authApi;
