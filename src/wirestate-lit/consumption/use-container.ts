import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";

/**
 * Represents result of the {@link useContainer} hook.
 *
 * @group Consumption
 */
export interface UseContainerValue {
  /**
   * The active container from the nearest parent context.
   */
  value: Container;
}

/**
 * Hook (consumer) to access the active container from the nearest parent context.
 *
 * @remarks
 * The returned value updates when the nearest provided container changes.
 *
 * @group Consumption
 *
 * @param host - The host element.
 * @returns An instance of {@link UseContainerValue}.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private container: UseContainerValue = useContainer(this);
 *
 *   public render() {
 *     return html`<div>${this.container.value.isBound(MyService)}</div>`;
 *   }
 * }
 * ```
 */
export function useContainer<E extends ReactiveControllerHost & HTMLElement>(host: E): UseContainerValue {
  dbg.info(prefix(__filename), "Creating:", {
    host,
  });

  const current: UseContainerValue = { value: null as unknown as Container };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: true,
    callback: (container) => {
      current.value = container;
    },
  });

  return current;
}
