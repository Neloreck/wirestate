import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContextObject } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Represents options for the {@link useInjection} hook.
 *
 * @group Consumption
 */
export interface UseInjectionOptions<T> {
  /**
   * Whether to subscribe to container changes.
   *
   * @remarks
   * If true, the service will be fetched only once when the controller is created.
   * Defaults to false.
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
 * Represents result of the {@link useInjection} hook.
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
 * Hook (controller) to inject a service from the IoC container.
 *
 * @group Consumption
 *
 * @param host - The host element.
 * @param optionsOrInjectionId - Injection options or service identifier.
 * @returns An instance of {@link UseInjectionValue}.
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
    context: IocContextObject,
    subscribe: !once,
    callback: (it) => {
      current.value = it.container.get(injectionId);
    },
  });

  return current;
}
