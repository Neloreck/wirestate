/**
 * Represents value that can be `T` or `null`.
 *
 * Fixture-local copy: the core `types/general` helpers are not public API, and
 * fixtures import packages through their public entries only.
 */
export type Nullable<T> = T | null;

/**
 * Represents value that can be `T`, `null`, or `undefined`.
 */
export type Maybe<T> = T | null | undefined;
