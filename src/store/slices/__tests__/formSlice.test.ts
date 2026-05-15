import { describe, it, expect } from 'vitest';
import formReducer, {
    setLoginEmail,
    setLoginError,
    resetForm
} from '../formSlice';

describe('formSlice', () => {
    const initialState = {
        login: { email: '', loading: false, error: null },
        signup: { email: '', loading: false, error: null },
        keys: { newKeyName: '', showModal: false, revealedKey: null, creating: false, error: null },
        billing: { upgrading: null, portalLoading: false, error: null },
    };

    it('should handle initial state', () => {
        expect(formReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('Given login form state', () => {
        describe('When setLoginEmail is dispatched', () => {
            it('Then it should update the login email', () => {
                const nextState = formReducer(initialState, setLoginEmail('test@forboc.ai'));
                expect(nextState.login.email).toBe('test@forboc.ai');
            });
        });

        describe('When setLoginError is dispatched', () => {
            it('Then it should update the login error', () => {
                const nextState = formReducer(initialState, setLoginError('Invalid credentials'));
                expect(nextState.login.error).toBe('Invalid credentials');
            });
        });
    });

    describe('Given dirty form state', () => {
        const dirtyState = {
            ...initialState,
            login: { email: 'bad@dev.com', loading: true, error: 'error' }
        };

        describe('When resetForm("login") is dispatched', () => {
            it('Then it should reset only the login form state', () => {
                const nextState = formReducer(dirtyState, resetForm('login'));
                expect(nextState.login).toEqual(initialState.login);
            });
        });
    });
});
