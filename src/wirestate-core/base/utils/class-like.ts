/**
 * Constructable class reference.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Newable<T = unknown> = new (...args: Array<any>) => T;

/**
 * Abstract class reference that cannot be constructed directly,
 * but can serve as a binding token.
 */
export interface AbstractClass<T> {
  prototype: T;
  name: string;
}

/**
 * Type-guard to assert if the given object is an (abstract) class.
 *
 * @param target - Value to check.
 * @returns Whether the value is a class-like function.
 * @internal
 */
export function isClassLike(target: unknown): target is Newable<unknown> | AbstractClass<unknown> {
  return typeof target === "function";
}
