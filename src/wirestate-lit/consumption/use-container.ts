import { ContextConsumer } from "@lit/context";
import { type ReactiveControllerHost } from "@lit/reactive-element";
import { type Container, WirestateError } from "@wirestate/core";

import { ContainerContext } from "../container/container-context";
import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";

/**
 * Describes value returned by {@link useContainer}.
 *
 * @group Injection
 */
export interface UseContainerValue {
  /**
   * The active container from the nearest parent context.
   *
   * @throws `WirestateError` When read before the container context resolves.
   */
  readonly value: Container;
}

/**
 * Consumes the active container from the nearest Lit context.
 *
 * @remarks
 * The returned value updates when the nearest provided container changes.
 * Reading `value` before the context resolves (no container provider above the host) throws.
 *
 * @group Injection
 *
 * @param host - Host element.
 * @returns Container holder that resolves to the active container.
 *
 * @example
 * ```typescript
 * import { LitElement, html } from "lit";
 *
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
  let resolved: boolean = false;
  let current: Container;

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: true,
    callback: (container) => {
      current = container;
      resolved = true;
    },
  });

  return {
    get value(): Container {
      if (!resolved) {
        throw new WirestateError(
          "Trying to access container context from a Lit element not nested under a container provider.",
          ERROR_CODE_INVALID_CONTEXT
        );
      }

      return current;
    },
  };
}
