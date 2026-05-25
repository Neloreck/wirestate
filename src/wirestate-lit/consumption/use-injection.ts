import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Optional } from "../types/general";

/**
 * Represents options for {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionOptions<T> {
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
  value?: Optional<T>;
  /**
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
}

/**
 * Represents value returned by {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionValue<T> {
  /**
   * The service identifier used for injection.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * The injected service instance.
   */
  value: T;
}

/**
 * Consumes a service from the nearest Lit container context.
 *
 * @group Consumption
 *
 * @param host - Host element.
 * @param optionsOrInjectionId - Service token or options.
 * @returns Mutable injection holder.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private myService = useInjection(this, MyService);
 *
 *   render() {
 *     return html`<div>${this.myService.value.getName()}</div>`;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private myService = useInjection(this, { injectionId: MyService, once: true });
 *
 *   render() {
 *     return html`<div>${this.myService.value.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function useInjection<T>(
  host: ReactiveControllerHost & HTMLElement,
  optionsOrInjectionId: UseInjectionOptions<T> | ServiceIdentifier<T>
): UseInjectionValue<T> {
  const options: UseInjectionOptions<T> =
    typeof optionsOrInjectionId === "object" && optionsOrInjectionId !== null && "injectionId" in optionsOrInjectionId
      ? optionsOrInjectionId
      : { injectionId: optionsOrInjectionId as ServiceIdentifier<T> };

  const { once, injectionId, value } = options;

  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    injectionId,
  });

  const current: UseInjectionValue<T> = { value: value as unknown as T, injectionId };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      current.value = container.get(injectionId);
    },
  });

  return current;
}
