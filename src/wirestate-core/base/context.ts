import { Container } from "./container";
import type { Token } from "./tokens";

/**
 * Injects a service within the current injection context, using the token provided.
 *
 * @param token
 */
export function inject<T>(token: Token<T>): T;
export function inject<T>(token: Token<T>, options: { multi: true }): Array<T>;
export function inject<T>(token: Token<T>, options: { optional: true }): T | undefined;
export function inject<T>(token: Token<T>, options: { multi: true; optional: true }): Array<T> | undefined;
export function inject<T>(token: Token<T>, options: { lazy: true }): () => T;
export function inject<T>(token: Token<T>, options: { lazy: true; multi: true }): () => Array<T>;
export function inject<T>(token: Token<T>, options: { lazy: true; optional: true }): () => T | undefined;
export function inject<T>(
  token: Token<T>,
  options: { lazy: true; multi: true; optional: true }
): () => Array<T> | undefined;
export function inject<T>(
  token: Token<T>,
  options?: { optional?: boolean; multi?: boolean; lazy?: boolean }
): T | Array<T> | undefined | (() => T | Array<T> | undefined) {
  try {
    return _currentContext.run((container) => container.get(token, options));
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
  run<T>(block: (container: Container) => T): T;
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
  public constructor(private readonly container: Container) {}

  public run<T>(block: (container: Container) => T): T {
    const originalContext = _currentContext;

    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;

      return block(this.container);
    } finally {
      _currentContext = originalContext;
    }
  }
}

let _currentContext: GlobalContext | InjectionContext = new GlobalContext();

/**
 * Creates a new injection context.
 *
 * @param container
 * @internal
 */
export function injectionContext(container: Container): Context {
  return new InjectionContext(container);
}

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
