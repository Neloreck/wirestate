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
 * Represents options for the {@link useOptionalInjection} hook.
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
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * Provides a value when the service identifier is not bound.
   */
  onFallback?: OptionalInjectionFallback<F>;
}

/**
 * Represents result of the {@link useOptionalInjection} hook.
 *
 * @group Consumption
 */
export interface UseOptionalInjectionValue<T, F = null> {
  /**
   * The service identifier used for injection.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * The injected service instance, fallback value, or `null`.
   */
  value: T | F;
}

/**
 * Hook (controller) to optionally inject a service from the IoC container.
 *
 * @remarks
 * Unlike {@link useInjection}, this hook does not throw if the dependency
 * is missing from the container.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The type returned by the fallback function.
 *
 * @param host - The host element.
 * @param optionsOrInjectionId - Injection options or service identifier.
 * @param onFallback - Optional function called to provide a value if the token is not bound.
 * @returns An instance of {@link UseOptionalInjectionValue}.
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
  optionsOrInjectionId: UseOptionalInjectionOptions<T, F> | ServiceIdentifier<T>,
  onFallback?: OptionalInjectionFallback<F>
): UseOptionalInjectionValue<T, F> {
  const options: UseOptionalInjectionOptions<T, F> =
    typeof optionsOrInjectionId === "object" && optionsOrInjectionId !== null && "injectionId" in optionsOrInjectionId
      ? optionsOrInjectionId
      : { injectionId: optionsOrInjectionId as ServiceIdentifier<T>, onFallback };

  const { injectionId, once, value } = options;
  const fallback: Optional<OptionalInjectionFallback<F>> = options.onFallback ?? onFallback ?? null;

  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    injectionId,
  });

  const current: UseOptionalInjectionValue<T, F> = {
    value: (value === undefined ? null : value) as T | F,
    injectionId,
  };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      if (container.isBound(injectionId)) {
        dbg.info(prefix(__filename), "Resolving injection:", {
          token: injectionId,
          name: (injectionId as AnyObject)?.name ?? injectionId,
          container,
          onFallback: fallback,
        });

        current.value = container.get(injectionId);
      } else if (fallback) {
        dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
          token: injectionId,
          name: (injectionId as AnyObject)?.name ?? injectionId,
          container,
          onFallback: fallback,
        });

        current.value = fallback(container);
      } else {
        dbg.info(prefix(__filename), "Injection not found, returning null:", {
          token: injectionId,
          name: (injectionId as AnyObject)?.name ?? injectionId,
          container,
          onFallback: fallback,
        });

        current.value = null as F;
      }
    },
  });

  return current;
}
