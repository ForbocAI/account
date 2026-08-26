import { baseApi } from './index';
import authContract from '../../../data/contracts/auth.json';
import type {
    AuthCredentials,
    AuthDocument,
    LogoutDocument,
} from '@/entities/auth/authTypes';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthDocument, AuthCredentials>({
            query: (credentials) => ({
                url: authContract.routes.loginApi,
                method: authContract.methods.create,
                body: credentials,
            }),
            invalidatesTags: ['User', 'Session'],
        }),
        signup: builder.mutation<AuthDocument, AuthCredentials>({
            query: (user) => ({
                url: authContract.routes.signupApi,
                method: authContract.methods.create,
                body: user,
            }),
            invalidatesTags: ['User', 'Session'],
        }),
        logout: builder.mutation<LogoutDocument, void>({
            query: () => ({
                url: authContract.routes.logoutApi,
                method: authContract.methods.create,
            }),
            invalidatesTags: ['User', 'Session'],
        }),
        getMe: builder.query<AuthDocument, void>({
            query: () => authContract.routes.meApi,
            providesTags: ['User', 'Session'],
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetMeQuery,
} = authApi;
