import { type Container, type ServiceToken } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../container/use-container";
import { type Optional } from "../types/general";

/**
 * A fallback for an optional injection: a raw value or a `(container) => value`
 * factory, used only when the token is not bound.
 *
 * @group Injection
 */
export type InjectionFallback<F> = F | ((container: Container) => F);

/**
 * Resolves a required value from the active container.
 *
 * @remarks
 * Use this overload when the token must be bound. The value re-resolves when the active container or token changes.
 *
 * @group Injection
 *
 * @template T - The resolved value type.
 *
 * @param token - Token to resolve.
 * @param options - Required lookup options.
 * @param options.optional - Must be omitted or `false`.
 * @param options.fallback - Must be omitted.
 * @returns The resolved value.
 *
 * @throws `WirestateError` when the token is not bound. Resolution errors from the container propagate unchanged.
 *
 * @example
 * ```tsx
 * const api = useInjection(ApiService);
 * ```
 */
export function useInjection<T>(token: ServiceToken<T>, options?: { optional?: false; fallback?: undefined }): T;

/**
 * Resolves an optional value from the active container.
 *
 * @remarks
 * Use this overload when the token may be absent. A bound token is resolved normally. An unbound token returns
 * `undefined`. The value re-resolves when the active container or token changes.
 *
 * @group Injection
 *
 * @template T - The resolved value type.
 *
 * @param token - Token to resolve.
 * @param options - Optional lookup options.
 * @param options.optional - Must be `true`.
 * @param options.fallback - Must be omitted.
 * @returns The resolved value, or `undefined` when the token is not bound.
 *
 * @throws `WirestateError` when resolving a bound token fails. Resolution errors from the container propagate unchanged.
 *
 * @example
 * ```tsx
 * const logger = useInjection(Logger, { optional: true });
 * ```
 */
export function useInjection<T>(token: ServiceToken<T>, options: { optional: true; fallback?: undefined }): Optional<T>;

/**
 * Resolves a value from the active container, or returns a fallback when the token is not bound.
 *
 * @remarks
 * Providing `fallback` makes the lookup optional. The fallback may be a raw value or a factory that receives the active
 * container. The value re-resolves when the active container or token changes. The fallback itself is not a memo
 * dependency.
 *
 * @group Injection
 *
 * @template T - The resolved value type.
 * @template F - The fallback value type.
 *
 * @param token - Token to resolve.
 * @param options - Fallback lookup options.
 * @param options.optional - Optional flag for compatibility with shared option objects.
 * @param options.fallback - Value or factory used when the token is not bound.
 * @returns The resolved value, or the fallback when the token is not bound.
 *
 * @throws `WirestateError` when resolving a bound token fails. Resolution errors from the container propagate unchanged.
 *
 * @example
 * ```tsx
 * const name = useInjection(UserName, { fallback: "guest" });
 * const logger = useInjection(FileLogger, { fallback: (container) => container.get(ConsoleLogger) });
 * ```
 */
export function useInjection<T, F>(
  token: ServiceToken<T>,
  options: { optional?: boolean; fallback: InjectionFallback<F> }
): T | F;
export function useInjection<T, F = undefined>(
  token: ServiceToken<T>,
  options?: { optional?: boolean; fallback?: InjectionFallback<F> }
): Optional<T | F> {
  const container: Container = useContainer();

  return useMemo(() => {
    const fallback: Optional<InjectionFallback<F>> = options?.fallback;

    // Required lookup (neither optional nor fallback): resolve directly so the container throws on a miss.
    if (!options?.optional && fallback === undefined) {
      return container.get<T>(token);
    }

    if (container.has(token)) {
      return container.get<T>(token);
    }

    if (fallback !== undefined) {
      return typeof fallback === "function" ? (fallback as (container: Container) => F)(container) : fallback;
    }

    return undefined;
    // Fallback is intentionally excluded from deps: only a container or token change re-resolves.
    // eslint-disable-next-line
  }, [container, token]);
}
