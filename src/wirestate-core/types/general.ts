/**
 * Generic object with string or symbol keys and any value.
 *
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents value that can be `T` or `null`.
 *
 * @template T - The base type.
 * @group general-types
 */
export type Nullable<T> = T | null;

/**
 * Represents value that can be `T` or `undefined`.
 *
 * @template T - The base type.
 * @group general-types
 */
export type Optional<T> = T | undefined;

/**
 * Represents value that can be `T` or a Promise of `T`.
 *
 * @template T - The base type.
 * @group general-types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents value that can be `T`, `null`, or `undefined`.
 *
 * @template T - The base type.
 * @group general-types
 */
export type Maybe<T> = T | null | undefined;

/**
 * Constructable class reference.
 */
export type Newable<T = unknown> = new (...args: Array<never>) => T;

/**
 * Abstract class reference that cannot be constructed directly,
 * but can serve as a binding token.
 */
export interface AbstractClass<T> {
  prototype: T;
  name: string;
}
