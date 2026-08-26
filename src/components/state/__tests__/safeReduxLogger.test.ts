import { describe, expect, it } from 'vitest';
import fixture from '../../../../data/tests/redux-logging.json';
import {
    summarizeReduxAction,
    summarizeReduxState,
} from '@/components/state/safeReduxLogger';

const excludesSensitiveValues = (value: unknown): boolean => {
    const serialized = JSON.stringify(value);
    return Object.values(fixture.sensitive).every((secret) => !serialized.includes(secret));
};

describe(fixture.cases.suite, () => {
    it(fixture.cases.action, () => {
        const summary = summarizeReduxAction(fixture.action);
        expect(summary.protocol).toEqual({
            endpoint: fixture.action.meta.arg.endpointName,
            requestStatus: fixture.action.meta.requestStatus,
        });
        expect(excludesSensitiveValues(summary)).toBe(true);
    });

    it(fixture.cases.state, () => {
        const summary = summarizeReduxState(fixture.state);
        expect(excludesSensitiveValues(summary)).toBe(true);
        expect(summary.auth).toEqual({ authenticated: fixture.state.auth.isAuthenticated });
    });
});
