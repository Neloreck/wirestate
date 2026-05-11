/**
 * Generic object with string or symbol keys and any value.
 *
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents a value that can be null.
 *
 * @template T - The base type.
 * @group general-types
 */
export type Optional<T> = T | null;

/**
 * Represents a value that can be a T or a Promise resolving to T.
 *
 * @template T - The base type.
 * @group general-types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a value that can be T, null, or undefined.
 *
 * @template T - The base type.
 * @group general-types
 */
export type Maybe<T> = T | null | undefined;
