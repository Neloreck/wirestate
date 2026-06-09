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
 * Injects a service asynchronously within the current injection context, using the token provided.
 *
 * @param token
 */
export function injectAsync<T>(token: Token<T>): Promise<T>;
export function injectAsync<T>(token: Token<T>, options: { multi: true }): Promise<Array<T>>;
export function injectAsync<T>(token: Token<T>, options: { optional: true }): Promise<T | undefined>;
export function injectAsync<T>(
  token: Token<T>,
  options: { multi: true; optional: true }
): Promise<Array<T> | undefined>;
export function injectAsync<T>(token: Token<T>, options: { lazy: true }): () => Promise<T>;
export function injectAsync<T>(token: Token<T>, options: { lazy: true; multi: true }): () => Promise<Array<T>>;
export function injectAsync<T>(token: Token<T>, options: { lazy: true; optional: true }): () => Promise<T | undefined>;
export function injectAsync<T>(
  token: Token<T>,
  options: { lazy: true; multi: true; optional: true }
): () => Promise<Array<T> | undefined>;
export function injectAsync<T>(
  token: Token<T>,
  options?: {
    optional?: boolean;
    multi?: boolean;
    lazy?: boolean;
  }
): Promise<T | Array<T> | undefined> | (() => Promise<T | Array<T> | undefined>) {
  try {
    if (options?.lazy) {
      return _currentContext.run((container) => container.getAsync(token, { ...options, lazy: true }));
    }

    return _currentContext.runAsync((container) => container.getAsync(token, { ...options, lazy: false }));
  } catch (error) {
    if (error instanceof NeedsInjectionContextError && options?.optional === true) {
      return Promise.resolve(undefined);
    }

    return Promise.reject(error);
  }
}

/**
 * A context has a specific container associated to it and allows you to run sync or async code.
 *
 * @internal
 */
interface Context {
  run<T>(block: (container: Container) => T): T;
  runAsync<T>(block: (container: Container) => Promise<T>): Promise<T>;
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

  public runAsync<T>(): Promise<T> {
    throw new NeedsInjectionContextError();
  }
}

/**
 * An injection context allows to perform dependency injection with `inject()` and `injectAsync()`.
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

  public async runAsync<T>(block: (container: Container) => Promise<T> | T): Promise<T> {
    const originalContext = _currentContext;

    try {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      _currentContext = this;

      return await block(this.container);
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
 * An error that occurs when `inject()` or `injectAsync()` is used outside an injection context.
 *
 * @internal
 */
class NeedsInjectionContextError extends Error {
  public constructor() {
    super(`You can only invoke inject() or injectAsync() within an injection context`);
  }
}
