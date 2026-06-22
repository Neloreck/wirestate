import { type Container, type ServiceToken } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";

/**
 * A fallback for {@link useOptionalInjection}: either a raw value or a
 * `(container) => value` factory, used only when the token is not bound.
 *
 * @remarks
 * The factory form is lazy and receives the container, so it can resolve the
 * fallback from other bindings. A bare function is *always* treated as the
 * factory — to fall back to a function *value*, return it from the factory
 * (`() => fn`).
 *
 * @group Injection
 */
export type OptionalInjectionFallback<F> = F | ((container: Container) => F);

/**
 * Safely resolves a value from the container, returning a fallback or `undefined` if not bound.
 *
 * @remarks
 * Unlike {@link useInjection}, this hook does not throw if the dependency
 * is missing from the container. When the token is not bound, the `fallback`
 * is used: a raw value is returned as-is, a factory is called with the
 * container. A bare function is always treated as the factory — wrap a
 * function fallback value as `() => fn`.
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 * @template F - The fallback value type (a raw value or a factory result).
 *
 * @param token - The token (string, symbol, or constructor).
 * @param fallback - Optional raw value or `(container) => value` factory, used when the token is not bound.
 *
 * @returns The resolved value, the fallback, or `undefined` when no fallback is provided.
 *
 * @example
 * ```tsx
 * // Raw value fallback.
 * const name = useOptionalInjection(UserName, "guest");
 *
 * // Factory fallback (lazy, receives the container).
 * const logger = useOptionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService));
 * ```
 */
export function useOptionalInjection<T, F = undefined>(
  token: ServiceToken<T>,
  fallback?: OptionalInjectionFallback<F>
): T | F {
  const container: Container = useContainer();

  // Revision bump forces a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    if (container.has(token)) {
      return container.get<T>(token);
    } else if (fallback !== undefined) {
      return typeof fallback === "function" ? (fallback as (container: Container) => F)(container) : (fallback as F);
    } else {
      return undefined as F;
    }
    // eslint-disable-next-line
  }, [container, token]);
}
