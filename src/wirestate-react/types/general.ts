/**
 * Represents an object with string or symbol keys.
 *
 * @group General Types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents value that can be `T` or `null`.
 *
 * @group General Types
 *
 * @template T - The base type.
 */
export type Nullable<T> = T | null;

/**
 * Represents value that can be `T` or `undefined`.
 *
 * @group General Types
 *
 * @template T - The base type.
 */
export type Optional<T> = T | undefined;

/**
 * Represents value that can be `T`, `null`, or `undefined`.
 *
 * @group General Types
 *
 * @template T - The base type.
 */
export type Maybe<T> = T | null | undefined;
