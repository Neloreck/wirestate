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
 * `@Injectable()` classes. Optional lookups return `undefined` instead of
 * throwing, and lazy lookups return a function that resolves the dependency
 * when called.
 *
 * @param token - Token to resolve from the current container.
 * @returns The resolved value, a lazy resolver, or `undefined` for optional misses.
 */
export function inject<T>(token: ServiceToken<T>): T;
export function inject<T>(token: ServiceToken<T>, options: { optional: true }): Optional<T>;
export function inject<T>(token: ServiceToken<T>, options: { lazy: true }): () => T;
export function inject<T>(token: ServiceToken<T>, options: { lazy: true; optional: true }): () => Optional<T>;
export function inject<T>(
  token: ServiceToken<T>,
  options?: { optional?: boolean; lazy?: boolean }
): Optional<T> | (() => Optional<T>) {
  try {
    return currentContext.run((container) => container.get(token, options));
  } catch (error) {
    if (error instanceof NeedsInjectionContextError && options?.optional === true) {
      return undefined;
    }

    throw error;
  }
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
