import { ContextConsumer } from "@lit/context";
import { type ReactiveControllerHost } from "@lit/reactive-element";
import { type Container, type ServiceToken } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { type Nullable } from "../types/general";

/**
 * A fallback for an optional injection: a raw value or a `(container) => value`
 * factory, used only when the token is not bound.
 *
 * @remarks
 * A bare function is always treated as the factory - to fall back to a function
 * value, return it from the factory (`() => fn`).
 *
 * @group Consumption
 */
export type InjectionFallback<F> = F | ((container: Container) => F);

/**
 * Describes options for {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionOptions<T, F = undefined> {
  /**
   * The token to inject.
   */
  token: ServiceToken<T>;

  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the value will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;

  /**
   * Initial value held until the context resolves.
   *
   * @remarks
   * Useful when templates may read the holder before the first context callback runs.
   */
  value?: Nullable<T | F>;

  /**
   * Resolve `undefined` instead of throwing when the token is not bound.
   */
  optional?: boolean;

  /**
   * Value used when the token is not bound. Providing it makes the lookup optional.
   *
   * @remarks
   * A function fallback is treated as a factory and receives the active container.
   */
  fallback?: InjectionFallback<F>;
}

/**
 * Describes value returned by {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionValue<T, F = never> {
  /**
   * The token used for injection.
   */
  token: ServiceToken<T>;

  /**
   * The injected value.
   */
  value: T | F;
}

/**
 * Consumes a value from the nearest Lit container context.
 *
 * @remarks
 * Returns a holder whose `value` updates when the container context changes,
 * unless `once` is set. Throws when the token is not bound. Pass `optional` to
 * hold `undefined` on a miss, or a `fallback` (which implies `optional`) to hold
 * a default.
 *
 * @group Consumption
 *
 * @param host - Host element.
 * @param token - Token to inject, or options carrying the token plus `once`/`value`/`optional`/`fallback`.
 * @returns Injection holder.
 *
 * @example
 * ```typescript
 * private service = useInjection(this, MyService);
 * private maybe = useInjection(this, { token: MyService, optional: true });
 * private name = useInjection(this, { token: UserName, fallback: "guest" });
 * ```
 */
export function useInjection<T>(
  host: ReactiveControllerHost & HTMLElement,
  token: ServiceToken<T>
): UseInjectionValue<T>;
export function useInjection<T>(
  host: ReactiveControllerHost & HTMLElement,
  options: UseInjectionOptions<T> & { optional?: false; fallback?: undefined }
): UseInjectionValue<T>;
export function useInjection<T>(
  host: ReactiveControllerHost & HTMLElement,
  options: UseInjectionOptions<T> & { optional: true; fallback?: undefined }
): UseInjectionValue<T, undefined>;
export function useInjection<T, F>(
  host: ReactiveControllerHost & HTMLElement,
  options: UseInjectionOptions<T, F> & { fallback: InjectionFallback<F> }
): UseInjectionValue<T, F>;
export function useInjection<T, F = undefined>(
  host: ReactiveControllerHost & HTMLElement,
  optionsOrToken: UseInjectionOptions<T, F> | ServiceToken<T>
): UseInjectionValue<T, F> {
  const options: UseInjectionOptions<T, F> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceToken<T> };

  const { once, token, value, optional, fallback } = options;

  const current: UseInjectionValue<T, F> = { value: value as T | F, token };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      // Required lookup (neither optional nor fallback): resolve directly so the container throws on a miss.
      if (!optional && fallback === undefined) {
        current.value = container.get(token);
      } else if (container.has(token)) {
        current.value = container.get(token);
      } else if (fallback !== undefined) {
        current.value =
          typeof fallback === "function" ? (fallback as (container: Container) => F)(container) : fallback;
      } else {
        current.value = undefined as F;
      }
    },
  });

  return current;
}
