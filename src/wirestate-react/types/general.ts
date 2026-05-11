/**
 * Represents any object with string or symbol keys.
 *
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents a function that returns a value of type `T`.
 *
 * @group general-types
 *
 * @template T - The return type of the function.
 */
export type Callable<T> = () => T;

/**
 * Represents a value that can be of type `T` or `null`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type Optional<T> = T | null;

/**
 * Represents a value that can be of type `T` or a `Promise` resolving to `T`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a value that can be of type `T`, `null`, or `undefined`.
 *
 * @group general-types
 *
 * @template T - The base type.
 */
export type Maybe<T> = T | null | undefined;
