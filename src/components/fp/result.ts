export type Result<ErrorValue, Value> =
    | { readonly tag: 'failure'; readonly error: ErrorValue }
    | { readonly tag: 'success'; readonly value: Value };

export type ResultHandlers<ErrorValue, Value, Output> = {
    readonly failure: (error: ErrorValue) => Output;
    readonly success: (value: Value) => Output;
};

export type NullableHandlers<Value, Output> = {
    readonly nothing: () => Output;
    readonly present: (value: Value) => Output;
};

export const failure = <ErrorValue>(error: ErrorValue): Result<ErrorValue, never> => ({
    tag: 'failure',
    error,
});

export const success = <Value>(value: Value): Result<never, Value> => ({
    tag: 'success',
    value,
});

export const matchResult = <ErrorValue, Value, Output>(
    result: Result<ErrorValue, Value>,
    handlers: ResultHandlers<ErrorValue, Value, Output>,
): Output => result.tag === 'failure'
    ? handlers.failure(result.error)
    : handlers.success(result.value);

export const matchNullable = <Value, Output>(
    value: Value | null | undefined,
    handlers: NullableHandlers<Value, Output>,
): Output => value == null ? handlers.nothing() : handlers.present(value);

export const attempt = <Value>(effect: () => Promise<Value>): Promise<Result<unknown, Value>> =>
    effect().then(success).catch(failure);
