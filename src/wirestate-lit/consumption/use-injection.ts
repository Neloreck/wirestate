import { ContextConsumer } from "@lit/context";
import { type ReactiveControllerHost } from "@lit/reactive-element";
import { type Container, type ServiceToken, WirestateError } from "@wirestate/core";

import { ContainerContext } from "../container/container-context";
import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { type Nullable } from "../types/general";

/**
 * A fallback for an optional injection: a raw value or a `(container) => value`
 * factory, used only when the token is not bound.
 *
 * @remarks
 * A bare function is always treated as the factory - to fall back to a function
 * value, return it from the factory (`() => fn`).
 *
 * @group Injection
 */
export type InjectionFallback<F> = F | ((container: Container) => F);

/**
 * Describes options for {@link useInjection}.
 *
 * @group Injection
 */
export interface UseInjectionOptions<T, F = undefined> {
  /**
   * The token to inject.
   */
  readonly token: ServiceToken<T>;

  /**
   * Initial value held until the context resolves.
   *
   * @remarks
   * Useful when templates may read the holder before the first context callback runs.
   */
  readonly value?: Nullable<T | F>;

  /**
   * Resolve `undefined` instead of throwing when the token is not bound.
   */
  readonly optional?: boolean;

  /**
   * Value used when the token is not bound. Providing it makes the lookup optional.
   *
   * @remarks
   * A function fallback is treated as a factory and receives the active container.
   */
  readonly fallback?: InjectionFallback<F>;
}

/**
 * Describes value returned by {@link useInjection}.
 *
 * @group Injection
 */
export interface UseInjectionValue<T, F = never> {
  /**
   * The token used for injection.
   */
  readonly token: ServiceToken<T>;

  /**
   * The injected value.
   *
   * @remarks
   * For a required lookup, reading this before the context resolves - i.e. the
   * host is not nested under a container provider - throws a {@link WirestateError},
   * unless an initial `value` was supplied. Optional / fallback lookups hold
   * `undefined` until resolution instead of throwing.
   *
   * @throws `WirestateError` When a required value is read before the container context resolves.
   */
  readonly value: T | F;
}

/**
 * Consumes a value from the nearest Lit container context.
 *
 * @remarks
 * Returns a holder whose `value` updates when the container context changes.
 * Throws when the token is not bound. Pass `optional` to hold `undefined` on a
 * miss, or a `fallback` (which implies `optional`) to hold a default. For a
 * required lookup, reading `value` before the context resolves (no container
 * provider above the host) throws, unless an initial `value` is set.
 *
 * @group Injection
 *
 * @param host - Host element.
 * @param token - Token to inject, or options carrying the token plus `value`/`optional`/`fallback`.
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

  const { token, value, optional, fallback } = options;

  // A required lookup has neither `optional` nor `fallback`; only then is an unresolved read a misuse.
  const required: boolean = !optional && fallback === undefined;
  // An explicit initial value is held (and returned) until the context resolves.
  const hasInitialValue: boolean = value !== undefined && value !== null;

  let resolved: boolean = false;
  let current: T | F;

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: true,
    callback: (container) => {
      // Required lookup (neither optional nor fallback): resolve directly so the container throws on a miss.
      if (required) {
        current = container.get(token);
      } else if (container.has(token)) {
        current = container.get(token);
      } else if (fallback !== undefined) {
        current = typeof fallback === "function" ? (fallback as (container: Container) => F)(container) : fallback;
      } else {
        current = undefined as F;
      }

      resolved = true;
    },
  });

  return {
    token,
    get value(): T | F {
      if (resolved) {
        return current;
      }

      if (hasInitialValue) {
        return value as T | F;
      }

      // A required injection read before the context resolves means no provider above the host.
      if (required) {
        throw new WirestateError(
          "Trying to inject a value from a Lit element not nested under a container provider.",
          ERROR_CODE_INVALID_CONTEXT
        );
      }

      // Optional / fallback lookups legitimately hold `undefined` until the context resolves.
      return undefined as F;
    },
  };
}
