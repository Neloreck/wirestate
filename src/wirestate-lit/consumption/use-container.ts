import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";

/**
 * Describes value returned by {@link useContainer}.
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
 * Consumes the active container from the nearest Lit context.
 *
 * @remarks
 * The returned value updates when the nearest provided container changes.
 *
 * @group Consumption
 *
 * @param host - Host element.
 * @returns Mutable container holder.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private container: UseContainerValue = useContainer(this);
 *
 *   public render() {
 *     return html`<div>${this.container.value.has(MyService)}</div>`;
 *   }
 * }
 * ```
 */
export function useContainer<E extends ReactiveControllerHost & HTMLElement>(host: E): UseContainerValue {
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
