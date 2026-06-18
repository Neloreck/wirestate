import { type Newable } from "../types/general";

import { type BindingDescriptor, type ServiceToken } from "./binding";

/**
 * Reference token for dependencies that do not have a class constructor token.
 *
 * @remarks
 * Use an `InjectionToken<T>` for constants, external objects, interfaces, and
 * other values that need a stable runtime token with a TypeScript value type.
 *
 * @group Bind
 *
 * @example
 * ```typescript
 * import { Container, InjectionToken, Injectable, inject } from "@wirestate/core";
 *
 * const API_URL = new InjectionToken<string>("API_URL");
 *
 * const container = new Container({
 *   bindings: [{ token: API_URL, value: "https://api.example.com" }],
 * });
 *
 * @Injectable()
 * class ApiClient {
 *   // `url` is typed as string, no cast needed.
 *   public constructor(private readonly url = inject(API_URL)) {}
 * }
 * ```
 */
export class InjectionToken<T> {
  /**
   * Phantom field that ties the token to its value type.
   * Never assigned at runtime. It exists so `InjectionToken<A>` is not
   * assignable to `InjectionToken<B>`.
   */
  protected readonly _type?: T;

  /**
   * Creates an injection token with a human-readable description.
   *
   * @param description - Description used in diagnostics.
   */
  public constructor(private readonly description: string | symbol) {}

  /**
   * Returns a diagnostic label for this token.
   *
   * @returns Human-readable token label.
   */
  public toString(): string {
    return `InjectionToken "${String(this.description)}"`;
  }
}

/**
 * Describes a service token, useful for error messages.
 *
 * @param token - ServiceToken to describe.
 * @returns Human-readable service token description.
 * @internal
 */
export function tokenToString<T>(token: ServiceToken<T>): string {
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
export function getBindingToken<T extends object = object>(binding: Newable<T> | BindingDescriptor): ServiceToken {
  return typeof binding === "function" ? binding : binding.token;
}
