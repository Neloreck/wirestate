/**
 * Represents an object with string or symbol keys.
 *
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents the function that returns `T`.
 *
 * @group general-types
 *
 * @template T - The return type of the function.
 */
export type Callable<T> = () => T;

/**
 * Represents value that can be `T` or `null`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type Optional<T> = T | null;

/**
 * Represents value that can be `T` or a Promise of `T`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents value that can be `T`, `null`, or `undefined`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type Maybe<T> = T | null | undefined;
