/**
 * @group general-types
 */
// eslint-disable-next-line
export type AnyObject = Record<string | symbol, any>;

/**
 * @group general-types
 */
export type Callable<T> = () => T;

/**
 * @group general-types
 */
export type Optional<T> = T | null;

/**
 * @group general-types
 */
export type Definable<T> = T | undefined;

/**
 * @group general-types
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * @group general-types
 */
export type Maybe<T> = T | null | undefined;
