import { describe, it, expect } from 'vitest';
import fixture from '../../../../data/tests/state.json';
import formReducer, {
    setLoginEmail,
    setLoginError,
    resetForm
} from '../formSlice';
import type { FormStateKey } from '../formSlice';

describe(fixture.form.suite, () => {
    const initialState = fixture.form.initialState;

    it(fixture.form.cases.initial, () => {
        expect(formReducer(undefined, { type: fixture.action.unknownType })).toEqual(initialState);
    });

    describe(fixture.form.cases.login, () => {
        describe(fixture.form.cases.email, () => {
            it(fixture.form.cases.email, () => {
                const nextState = formReducer(initialState, setLoginEmail(fixture.form.login.email));
                expect(nextState.login.email).toBe(fixture.form.login.email);
            });
        });

        describe(fixture.form.cases.error, () => {
            it(fixture.form.cases.error, () => {
                const nextState = formReducer(initialState, setLoginError(fixture.form.login.error));
                expect(nextState.login.error).toBe(fixture.form.login.error);
            });
        });
    });

    describe(fixture.form.cases.dirty, () => {
        const dirtyState = {
            ...initialState,
            login: fixture.form.dirtyLogin,
        };

        describe(fixture.form.cases.reset, () => {
            it(fixture.form.cases.reset, () => {
                const nextState = formReducer(
                    dirtyState,
                    resetForm(fixture.form.scope as FormStateKey),
                );
                expect(nextState.login).toEqual(initialState.login);
            });
        });
    });
});
