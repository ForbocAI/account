import type { Middleware } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import loggingContract from '../../../data/contracts/redux-logging.json';
import { matchNullable } from '@/components/fp/result';

type UnknownRecord = Readonly<Record<string, unknown>>;

const record = (value: unknown): UnknownRecord => matchNullable(value, {
    nothing: () => ({}),
    present: (candidate) => typeof candidate === 'object'
        ? candidate as UnknownRecord
        : {},
});

const present = (value: unknown): boolean => matchNullable(value, {
    nothing: () => false,
    present: () => true,
});

const countEntries = (value: unknown): number => Object.keys(record(value)).length;

const workflowSummary = (value: unknown): UnknownRecord => {
    const workflow = record(value);
    return {
        loading: Boolean(workflow.loading ?? workflow.creating ?? workflow.portalLoading),
        active: Boolean(workflow.showModal ?? workflow.upgrading),
        hasError: present(workflow.error),
    };
};

export const summarizeReduxAction = (action: unknown): UnknownRecord => {
    const candidate = record(action);
    const meta = record(candidate.meta);
    const argument = record(meta.arg);
    return {
        type: typeof candidate.type === 'string' ? candidate.type : typeof candidate.type,
        protocol: {
            endpoint: typeof argument.endpointName === 'string' ? argument.endpointName : null,
            requestStatus: typeof meta.requestStatus === 'string' ? meta.requestStatus : null,
        },
    };
};

export const summarizeReduxState = (state: unknown): UnknownRecord => {
    const root = record(state);
    const auth = record(root.auth);
    const form = record(root.form);
    const api = record(root.api);
    return {
        slices: Object.keys(root).sort(),
        auth: { authenticated: Boolean(auth.isAuthenticated) },
        workflow: {
            login: workflowSummary(form.login),
            signup: workflowSummary(form.signup),
            keys: workflowSummary(form.keys),
            billing: workflowSummary(form.billing),
        },
        protocol: {
            queries: countEntries(api.queries),
            mutations: countEntries(api.mutations),
        },
    };
};

export const safeReduxLogger = createLogger({
    ...loggingContract.logger,
    actionTransformer: summarizeReduxAction,
    stateTransformer: summarizeReduxState,
}) as Middleware;

export const safeReduxLoggingEnabled = (): boolean =>
    process.env.NODE_ENV === loggingContract.developmentEnvironment
    && process.env.NEXT_PUBLIC_ACCOUNT_REDUX_LOGGING === loggingContract.enabledValue;
