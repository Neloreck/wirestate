import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container, ServiceIdentifier } from "@wirestate/core";

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
export interface UseOptionalInjectionOptions<T, F = null> {
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the service will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;
  /**
   * Initial value before the service is fetched.
   */
  value?: T | F;
  /**
   * The service token to inject.
   */
  token: ServiceIdentifier<T>;
  /**
   * Provides a value when the service token is not bound.
   */
  onFallback?: OptionalInjectionFallback<F>;
}

/**
 * Describes value returned by {@link useOptionalInjection}.
 *
 * @group Consumption
 */
export interface UseOptionalInjectionValue<T, F = null> {
  /**
   * The service token used for injection.
   */
  token: ServiceIdentifier<T>;
  /**
   * The injected service instance, fallback value, or `null`.
   */
  value: T | F;
}

/**
 * Consumes a service if the nearest container has it.
 *
 * @remarks
 * Missing token means fallback result, or `null` when no fallback exists.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The type returned by the fallback function.
 *
 * @param host - Host element.
 * @param optionsOrToken - Service token or options.
 * @param onFallback - Fallback for missing bindings.
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
export function useOptionalInjection<T, F = null>(
  host: ReactiveControllerHost & HTMLElement,
  optionsOrToken: UseOptionalInjectionOptions<T, F> | ServiceIdentifier<T>,
  onFallback?: OptionalInjectionFallback<F>
): UseOptionalInjectionValue<T, F> {
  const options: UseOptionalInjectionOptions<T, F> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceIdentifier<T>, onFallback };

  const { once, token, value } = options;
  const fallback: Optional<OptionalInjectionFallback<F>> = options.onFallback ?? onFallback ?? null;

  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    token,
  });

  const current: UseOptionalInjectionValue<T, F> = {
    value: (value === undefined ? null : value) as T | F,
    token,
  };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      if (container.isBound(token)) {
        dbg.info(prefix(__filename), "Resolving injection:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          onFallback: fallback,
        });

        current.value = container.get(token);
      } else if (fallback) {
        dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          onFallback: fallback,
        });

        current.value = fallback(container);
      } else {
        dbg.info(prefix(__filename), "Injection not found, returning null:", {
          token,
          name: (token as AnyObject)?.name ?? token,
          container,
          onFallback: fallback,
        });

        current.value = null as F;
      }
    },
  });

  return current;
}
