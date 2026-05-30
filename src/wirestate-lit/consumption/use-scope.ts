import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { WireScope } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";

import { UseInjectionValue } from "./use-injection";

/**
 * Represents value returned by {@link useScope}.
 *
 * @group Consumption
 */
export type UseScopeValue = UseInjectionValue<WireScope>;

/**
 * Consumes a {@link WireScope} from the nearest Lit container context.
 *
 * @remarks
 * The returned value updates when the nearest provided container changes.
 *
 * @group Consumption
 *
 * @param host - Host element.
 * @returns Mutable scope holder.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private scope: UseScopeValue = useScope(this);
 *
 *   public connectedCallback(): void {
 *     super.connectedCallback();
 *     this.scope.value.emitEvent("UI_READY");
 *   }
 * }
 * ```
 */
export function useScope<E extends ReactiveControllerHost & HTMLElement>(host: E): UseScopeValue {
  dbg.info(prefix(__filename), "Creating:", {
    host,
    token: WireScope,
  });

  const current: UseInjectionValue<WireScope> = { value: undefined as unknown as WireScope, token: WireScope };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: true,
    callback: (container) => {
      current.value = container.get(WireScope);
    },
  });

  return current;
}
