import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { Identifier } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Optional } from "../types/general";

/**
 * Describes options for {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionOptions<T> {
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the value will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;

  /**
   * Initial value before the instance is fetched.
   */
  value?: Optional<T>;

  /**
   * The token to inject.
   */
  token: Identifier<T>;
}

/**
 * Describes value returned by {@link useInjection}.
 *
 * @group Consumption
 */
export interface UseInjectionValue<T> {
  /**
   * The token used for injection.
   */
  token: Identifier<T>;

  /**
   * The injected value.
   */
  value: T;
}

/**
 * Consumes a value from the nearest Lit container context.
 *
 * @group Consumption
 *
 * @param host - Host element.
 * @param optionsOrToken - Service token or options.
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
 *   private myService = useInjection(this, { token: MyService, once: true });
 *
 *   render() {
 *     return html`<div>${this.myService.value.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function useInjection<T>(
  host: ReactiveControllerHost & HTMLElement,
  optionsOrToken: UseInjectionOptions<T> | Identifier<T>
): UseInjectionValue<T> {
  const options: UseInjectionOptions<T> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as Identifier<T> };

  const { once, token, value } = options;

  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    token,
  });

  const current: UseInjectionValue<T> = { value: value as unknown as T, token };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (container) => {
      current.value = container.get(token);
    },
  });

  return current;
}
