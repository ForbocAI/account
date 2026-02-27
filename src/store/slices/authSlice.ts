import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

interface User {
    id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

// Selectors
const selectAuth = (state: { auth: AuthState }) => state.auth;

export const selectUser = createSelector(selectAuth, (auth) => auth.user as User | null);
export const selectIsAuthenticated = createSelector(selectAuth, (auth) => auth.isAuthenticated as boolean);

export default authSlice.reducer;
