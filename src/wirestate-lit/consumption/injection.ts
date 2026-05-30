import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { AnyObject, FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * Describes type returned by {@link injection}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Consumption
 */
export interface InjectionDecorator<T> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends T>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, T>;
}

/**
 * Describes options for {@link injection}.
 *
 * @group Consumption
 */
export interface InjectionOptions<T> {
  /**
   * The service token to inject.
   */
  token: ServiceIdentifier<T>;
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the property will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;
}

/**
 * Injects a container value into a Lit element property.
 *
 * @remarks
 * The property follows the nearest container context unless `once` is `true`.
 *
 * @group Consumption
 *
 * @param optionsOrToken - Service token or options.
 * @returns Lit property decorator.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection(MyService)
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection({ token: MyService, once: true })
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function injection<T>(optionsOrToken: InjectionOptions<T> | ServiceIdentifier<T>): InjectionDecorator<T> {
  const options: InjectionOptions<T> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceIdentifier<T> };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T>
  ): void => {
    const { once, token } = options;

    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (container) => {
            protoOrTarget.set.call(this, container.get(token));
          },
          subscribe: !once,
        });
      });
    } else {
      // Experimental decorators branch.
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(element, {
          context: ContainerContext,
          callback: (container) => {
            (element as AnyObject)[nameOrContext] = container.get(token);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
