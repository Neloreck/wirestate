import { ContextConsumer } from "@lit/context";
import { type ReactiveControllerHost } from "@lit/reactive-element";
import { type Container, type ServiceToken } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { type Optional } from "../types/general";

/**
 * A fallback for an optional injection: either a raw value or a
 * `(container) => value` factory, used only when the token is not bound.
 *
 * @remarks
 * A bare function is *always* treated as the factory — to fall back to a
 * function *value*, return it from the factory (`() => fn`).
 *
 * @group Consumption
 */
export type OptionalInjectionFallback<T> = T | ((container: Container) => T);

/**
 * Describes options for {@link useOptionalInjection}.
 *
 * @group Consumption
 */
export interface UseOptionalInjectionOptions<T, F = undefined> {
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the value will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;

  /**
   * Initial value before the value is fetched.
   */
  value?: T | F;

  /**
   * The token to inject.
   */
  token: ServiceToken<T>;

  /**
   * Provides a value when the token is not bound.
   */
  fallback?: OptionalInjectionFallback<F>;
}

/**
 * Describes value returned by {@link useOptionalInjection}.
 *
 * @group Consumption
 */
export interface UseOptionalInjectionValue<T, F = undefined> {
  /**
   * The token used for injection.
   */
  token: ServiceToken<T>;

  /**
   * The injected instance, fallback value, or `undefined`.
   */
  value: T | F;
}

/**
 * Consumes a token if the nearest container has it.
 *
 * @remarks
 * Missing token means the fallback result, or `undefined` when no fallback exists.
 * The fallback is a raw value (returned as-is) or a `(container) => value` factory
 * (called lazily). A bare function is always treated as the factory — wrap a
 * function fallback value as `() => fn`.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The fallback value type (a raw value or a factory result).
 *
 * @param host - Host element.
 * @param optionsOrToken - Service token or options.
 * @param fallback - Raw value or `(container) => value` factory, used when the token is not bound.
 * @returns Mutable injection holder.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   // Raw value fallback.
 *   private name = useOptionalInjection(this, UserName, "guest");
 *
 *   // Factory fallback (lazy, receives the container).
 *   private logger = useOptionalInjection(this, FileLogger, (container) => container.get(ConsoleLoggerService));
 *
 *   render() {
 *     return html`<div>${this.logger.value?.getName() ?? "No logger"}</div>`;
 *   }
 * }
 * ```
 */
export function useOptionalInjection<T, F = undefined>(
  host: ReactiveControllerHost & HTMLElement,
  optionsOrToken: UseOptionalInjectionOptions<T, F> | ServiceToken<T>,
  fallback?: OptionalInjectionFallback<F>
): UseOptionalInjectionValue<T, F> {
  const options: UseOptionalInjectionOptions<T, F> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceToken<T>, fallback: fallback };

  const { once, token, value } = options;
  const resolvedFallback: Optional<OptionalInjectionFallback<F>> =
    options.fallback !== undefined ? options.fallback : fallback;

  const current: UseOptionalInjectionValue<T, F> = {
    value: value as T | F,
    token,
  };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      if (container.has(token)) {
        current.value = container.get(token);
      } else if (resolvedFallback !== undefined) {
        current.value =
          typeof resolvedFallback === "function"
            ? (resolvedFallback as (container: Container) => F)(container)
            : (resolvedFallback as F);
      } else {
        current.value = undefined as F;
      }
    },
  });

  return current;
}
