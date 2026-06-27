import { type Newable } from "../types/general";

import { type BindingDescriptor, type ServiceToken } from "./binding";

/**
 * Typed reference token for dependencies stored in a container.
 *
 * @remarks
 * Use an `InjectionToken<T>` when a dependency needs a named, collision-free runtime key
 * that carries the resolved TypeScript type. It works well for configuration, external
 * objects, interfaces, and service contracts that should be resolved through an explicit key.
 * The token is identified by object reference, not by its description.
 *
 * @group Bind
 *
 * @example
 * ```typescript
 * import { Container, InjectionToken, Injectable, inject } from "@wirestate/core";
 *
 * interface RuntimeConfig {
 *   readonly apiUrl: string;
 * }
 *
 * const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>("RUNTIME_CONFIG");
 *
 * const container = new Container({
 *   bindings: [{ token: RUNTIME_CONFIG, value: { apiUrl: "https://api.example.com" } }],
 * });
 *
 * @Injectable()
 * class ApiClient {
 *   public constructor(private readonly config = inject(RUNTIME_CONFIG)) {}
 * }
 * ```
 */
export class InjectionToken<T> {
  /**
   * Phantom field that ties the token to its value type.
   * It exists so `InjectionToken<A>` is not assignable to `InjectionToken<B>`.
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
