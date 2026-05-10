import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Options for the {@link useInjection} hook.
 *
 * @group consumption
 */
export interface UseInjectionOptions<T> {
  /**
   * If true, the service will be fetched only once when the controller is created.
   * If false (default), it will update if the container in the context changes.
   */
  once?: boolean;
  /**
   * Initial value for the injection before it's fetched from the container.
   */
  value?: Optional<T>;
  /**
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
}

/**
 * The return value of the {@link useInjection} hook, containing the injected service.
 *
 * @group consumption
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
 * Hook (controller) to inject a service from the IoC container in a Lit component.
 *
 * @group consumption
 *
 * @param host - the host element
 * @param optionsOrInjectionId - injection options including the service identifier or the service identifier itself
 * @returns injection descriptor object
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
export function useInjection<T extends object, E extends ReactiveControllerHost & HTMLElement>(
  host: E,
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
    callback: (it) => {
      current.value = it.container.get(injectionId);
    },
  });

  return current;
}
