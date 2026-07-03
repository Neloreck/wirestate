import type { ServiceToken } from "../binding/binding";
import type { Optional } from "../types/general";

import type { ContainerKernel } from "./container-kernel";

/**
 * An error that occurs when `inject()` is used outside an injection context.
 *
 * @internal
 */
class NeedsInjectionContextError extends Error {
  public constructor() {
    super(`You can only invoke inject() within an injection context`);
  }
}

/**
 * Resolves a dependency from the container currently constructing a service.
 *
 * @remarks
 * Use `inject()` in constructor defaults or field initializers of
 * `@Injectable()` classes, or inside factory bindings. Dependency resolution
 * uses the same rules as `Container.get()`, including parent lookup.
 *
 * @group Container
 *
 * @template T - Value type resolved for the token.
 *
 * @param token - Token to resolve from the current container.
 * @returns The resolved value.
 *
 * @throws {@link WirestateError} If the token is not bound,
 *   or if a circular dependency is detected while constructing the value.
 *   Errors thrown by a binding's constructor or factory propagate unchanged.
 * @throws Error If there is no active injection context.
 */
export function inject<T>(token: ServiceToken<T>): T;

/**
 * Optionally resolves a dependency from the current injection context.
 *
 * @template T - Value type resolved for the token.
 *
 * @param token - Token to resolve from the current container.
 * @param options - Optional lookup options.
 * @param options.optional - Return `undefined` instead of throwing on a miss.
 * @returns The resolved value, or `undefined` when the token is not bound.
 *
 * @throws Error If there is no active injection context.
 */
export function inject<T>(token: ServiceToken<T>, options: { optional: true }): Optional<T>;

/**
 * Returns a lazy resolver for a dependency in the current injection context.
 *
 * @remarks
 * The returned function closes over the active container and resolves the token
 * when called. Use it to break circular dependencies or avoid constructing a
 * dependency until a method needs it.
 *
 * @template T - Value type resolved for the token.
 *
 * @param token - Token to resolve from the current container.
 * @param options - Lazy lookup options.
 * @param options.lazy - Return a resolver function instead of resolving immediately.
 * @returns Function that resolves the token when called.
 *
 * @throws Error If there is no active injection context.
 */
export function inject<T>(token: ServiceToken<T>, options: { lazy: true }): () => T;

/**
 * Returns a lazy optional resolver for a dependency in the current injection context.
 *
 * @template T - Value type resolved for the token.
 *
 * @param token - Token to resolve from the current container.
 * @param options - Lazy optional lookup options.
 * @param options.lazy - Return a resolver function instead of resolving immediately.
 * @param options.optional - Return `undefined` from the resolver on a miss.
 * @returns Function that resolves the token when called, or returns `undefined` when missing.
 *
 * @throws Error If there is no active injection context (thrown eagerly, before the resolver is returned).
 */
export function inject<T>(token: ServiceToken<T>, options: { lazy: true; optional: true }): () => Optional<T>;

export function inject<T>(
  token: ServiceToken<T>,
  options?: { optional?: boolean; lazy?: boolean }
): Optional<T> | (() => Optional<T>) {
  return currentContext.run((container) => container.get(token, options));
}

/**
 * A context has a specific container associated to it and allows you to run code against it.
 *
 * @internal
 */
interface Context {
  run<T>(block: (container: ContainerKernel) => T): T;
}

/**
 * The global context does not allow dependency injection.
 *
 * @internal
 */
class GlobalContext implements Context {
  public run<T>(): T {
    throw new NeedsInjectionContextError();
  }
}

/**
 * An injection context allows to perform dependency injection with `inject()`.
 *
 * @internal
 */
class InjectionContext implements Context {
  public constructor(private readonly container: ContainerKernel) {}

  public run<T>(block: (container: ContainerKernel) => T): T {
    const originalContext = currentContext;

    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      currentContext = this;

      return block(this.container);
    } finally {
      currentContext = originalContext;
    }
  }
}

let currentContext: GlobalContext | InjectionContext = new GlobalContext();

/**
 * Creates a new injection context.
 *
 * @param container - ContainerKernel the context resolves against.
 * @returns Injection context bound to the container.
 * @internal
 */
export function injectionContext(container: ContainerKernel): Context {
  return new InjectionContext(container);
}
