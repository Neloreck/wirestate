import type { Newable } from "../types/general";

import type { BindingDescriptor, Identifier } from "./binding";

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
 * Describes an identifier, useful for error messages.
 *
 * @param token - Identifier to describe.
 * @returns Human-readable identifier description.
 * @internal
 */
export function tokenToString<T>(token: Identifier<T>): string {
  if (typeof token === "function") {
    return token.name;
  } else if (typeof token === "symbol") {
    return token.description ?? String(token);
  } else if (token instanceof InjectionToken) {
    return token.toString();
  } else {
    return token as string;
  }
}

/**
 * Returns the token for a binding.
 *
 * @internal
 *
 * @template T - Injectable type.
 *
 * @param binding - Service class or descriptor.
 * @returns Token used for container resolution.
 */
export function getBindingToken<T extends object = object>(binding: Newable<T> | BindingDescriptor): Identifier {
  return typeof binding === "function" ? binding : binding.token;
}
