import type { Binding } from "./bindings";
import { type AbstractClass, type Class, isClassLike } from "./utils";

/**
 * An identifier is a reference to a service in the dependency injection (DI) container:
 * class constructor, abstract class, string, symbol, or {@link InjectionToken}.
 * When obtaining a service from the container, you should use its identifier.
 */
export type Identifier<T = unknown> = Class<T> | AbstractClass<T> | string | symbol | InjectionToken<T>;

/**
 * A unique injection token object, that is used by reference. Can hold a generic type.
 */
export class InjectionToken<T> {
  /**
   * Phantom field that ties the token to its value type.
   * Never assigned at runtime — exists purely so `InjectionToken<A>` is not assignable to `InjectionToken<B>`.
   */
  protected readonly _type?: T;

  public constructor(private readonly description: string | symbol) {}

  public toString(): string {
    return `InjectionToken "${String(this.description)}"`;
  }
}

/**
 * Type-guard to check if an identifier is a class reference.
 *
 * @param token
 * @internal
 */
export function isClassToken<T>(token: Identifier<T>): token is Class<T> {
  return isClassLike(token);
}

/**
 * Type-guard to check if an identifier is an InjectionToken.
 *
 * @param token
 * @internal
 */
export function isInjectionToken<T>(token: Identifier<T>): token is InjectionToken<T> {
  return token instanceof InjectionToken;
}

/**
 * Describes an identifier, useful for error messages.
 *
 * @param token
 * @internal
 */
export function toString<T>(token: Identifier<T>): string {
  if (isClassLike(token)) {
    return token.name;
  } else if (typeof token === "symbol") {
    return token.description ?? String(token);
  } else if (token instanceof InjectionToken) {
    return token.toString();
  } else {
    return token;
  }
}

/**
 * Returns the token a binding is registered under.
 *
 * @param binding
 * @internal
 */
export function getBindingToken<T>(binding: Binding<T>): Identifier<T> {
  return isClassLike(binding) ? (binding as Identifier<T>) : binding.token;
}
