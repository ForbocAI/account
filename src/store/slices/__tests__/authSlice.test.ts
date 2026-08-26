import { describe, it, expect } from 'vitest';
import fixture from '../../../../data/tests/state.json';
import authReducer, { setCredentials, logout } from '../authSlice';

describe(fixture.auth.suite, () => {
    const initialState = fixture.auth.initialState;

    it(fixture.auth.cases.initial, () => {
        expect(authReducer(undefined, { type: fixture.action.unknownType })).toEqual(initialState);
    });

    describe(fixture.auth.cases.unauthenticated, () => {
        describe(fixture.auth.cases.credentials, () => {
            it(fixture.auth.cases.credentials, () => {
                const user = fixture.auth.user;
                const nextState = authReducer(initialState, setCredentials(user));

                expect(nextState.user).toEqual(user);
                expect(nextState.isAuthenticated).toBe(fixture.auth.authenticatedState.isAuthenticated);
            });
        });
    });

    describe(fixture.auth.cases.authenticated, () => {
        describe(fixture.auth.cases.logout, () => {
            it(fixture.auth.cases.logout, () => {
                const nextState = authReducer(fixture.auth.authenticatedState, logout());

                expect(nextState.user).toBe(fixture.auth.initialState.user);
                expect(nextState.isAuthenticated).toBe(fixture.auth.initialState.isAuthenticated);
            });
        });
    });
});
