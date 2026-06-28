/**
 * Generic object with string or symbol keys and any value.
 *
 * @group General Types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * Represents value that can be `T` or `null`.
 *
 * @template T - The base type.
 * @group General Types
 */
export type Nullable<T> = T | null;

/**
 * Represents value that can be `T` or `undefined`.
 *
 * @template T - The base type.
 * @group General Types
 */
export type Optional<T> = T | undefined;

/**
 * Represents value that can be `T` or a Promise of `T`.
 *
 * @template T - The base type.
 * @group General Types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents value that can be `T`, `null`, or `undefined`.
 *
 * @template T - The base type.
 * @group General Types
 */
export type Maybe<T> = T | null | undefined;

/**
 * Constructor type for a concrete class Wirestate can instantiate.
 *
 * @remarks
 * Used for service classes, class tokens, and instance binding implementations.
 *
 * @template T - Instance type the constructor produces.
 *
 * @group General Types
 */
export type Newable<T = unknown> = new (...args: Array<never>) => T;

/**
 * Abstract class reference that cannot be constructed directly,
 * but can serve as a binding token.
 *
 * @template T - Instance type the abstract class describes.
 *
 * @group General Types
 */
export interface AbstractClass<T> {
  prototype: T;
  name: string;
}
