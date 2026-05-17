import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { WireScope } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";

import { UseInjectionValue } from "./use-injection";

/**
 * Represents result of the {@link useScope} hook.
 *
 * @group Consumption
 */
export type UseScopeValue = UseInjectionValue<WireScope>;

/**
 * Hook (consumer) to access the active {@link WireScope} from the nearest parent context.
 *
 * @remarks
 * The returned value updates when the nearest provided container changes.
 *
 * @group Consumption
 *
 * @param host - The host element.
 * @returns An instance of {@link UseScopeValue}.
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
    injectionId: WireScope,
  });

  const current: UseInjectionValue<WireScope> = { value: undefined as unknown as WireScope, injectionId: WireScope };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: true,
    callback: (container) => {
      current.value = container.get(WireScope);
    },
  });

  return current;
}
