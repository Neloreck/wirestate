import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container, ServiceToken } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { AnyObject, Optional } from "../types/general";

/**
 * Provides a fallback value when an optional injection is not bound.
 *
 * @group Consumption
 */
export type OptionalInjectionFallback<T> = (container: Container) => T;

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
 * Missing token means fallback result, or `undefined` when no fallback exists.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The type returned by the fallback function.
 *
 * @param host - Host element.
 * @param optionsOrToken - Service token or options.
 * @param fallback - Fallback for missing bindings.
 * @returns Mutable injection holder.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
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
  const resolvedFallback: Optional<OptionalInjectionFallback<F>> = options.fallback ?? fallback ?? undefined;

  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    token,
  });

  const current: UseOptionalInjectionValue<T, F> = {
    value: value as T | F,
    token,
  };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      if (container.has(token)) {
        dbg.info(prefix(__filename), "Resolving injection:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          fallback: resolvedFallback,
        });

        current.value = container.get(token);
      } else if (resolvedFallback) {
        dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          fallback: resolvedFallback,
        });

        current.value = resolvedFallback(container);
      } else {
        dbg.info(prefix(__filename), "Injection not found, returning undefined:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          fallback: resolvedFallback,
        });

        current.value = undefined as F;
      }
    },
  });

  return current;
}
