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
 * Resolves a value from the active container.
 *
 * @remarks
 * Throws when the token is not bound. Pass `optional` to receive `undefined` on
 * a miss instead, or a `fallback` (which implies `optional`) to receive a
 * default. The value re-resolves when the active container or token changes.
 *
 * @group Injection
 *
 * @template T - The resolved value type.
 * @template F - The fallback value type.
 *
 * @param token - Token to resolve.
 * @param options - Resolution options.
 *
 * @param options.optional - Resolve `undefined` instead of throwing when the token is not bound.
 * @param options.fallback - Value used when the token is not bound. Providing it implies `optional`.
 * @returns The resolved value, the fallback, or `undefined` on a miss.
 *
 * @throws `WirestateError` when the token is not bound and the lookup is neither optional nor given a fallback.
 *
 * @example
 * ```tsx
 * const api = useInjection(ApiService); // throws if unbound
 * const logger = useInjection(Logger, { optional: true }); // Logger | undefined
 * const name = useInjection(UserName, { fallback: "guest" }); // string
 * ```
 */
export function useInjection<T>(token: ServiceToken<T>, options?: { optional?: false; fallback?: undefined }): T;
export function useInjection<T>(token: ServiceToken<T>, options: { optional: true; fallback?: undefined }): Optional<T>;
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
