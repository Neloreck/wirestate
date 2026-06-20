/**
 * A value that may be absent.
 */
export type Optional<T> = T | undefined;

/**
 * A value that may be null.
 */
export type Nullable<T> = T | null;

/**
 * A tri-state value: present, empty, or absent.
 */
export type Maybe<T> = T | null | undefined;

export type AnyCallable<T = void> = (...args: Array<unknown>) => T;
