import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from '../authSlice';

describe('authSlice', () => {
    const initialState = {
        user: null,
        isAuthenticated: false,
    };

    it('should handle initial state', () => {
        expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('Given a user is not authenticated', () => {
        describe('When setCredentials is dispatched', () => {
            it('Then it should update the user and set isAuthenticated to true', () => {
                const user = { id: '1', email: 'test@forboc.ai' };
                const nextState = authReducer(initialState, setCredentials(user));

                expect(nextState.user).toEqual(user);
                expect(nextState.isAuthenticated).toBe(true);
            });
        });
    });

    describe('Given a user is authenticated', () => {
        const authenticatedState = {
            user: { id: '1', email: 'test@forboc.ai' },
            isAuthenticated: true,
        };

        describe('When logout is dispatched', () => {
            it('Then it should clear the user and set isAuthenticated to false', () => {
                const nextState = authReducer(authenticatedState, logout());

                expect(nextState.user).toBeNull();
                expect(nextState.isAuthenticated).toBe(false);
            });
        });
    });
});
