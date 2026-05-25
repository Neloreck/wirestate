import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { AnyObject, FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * Represents type returned by {@link injection}.
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
 * Represents options for {@link injection}.
 *
 * @group Consumption
 */
export interface InjectionOptions<T> {
  /**
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
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
 * @param optionsOrInjectionId - Service token or options.
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
 *   @injection({ injectionId: MyService, once: true })
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function injection<T>(optionsOrInjectionId: InjectionOptions<T> | ServiceIdentifier<T>): InjectionDecorator<T> {
  const options: InjectionOptions<T> =
    typeof optionsOrInjectionId === "object" && optionsOrInjectionId !== null && "injectionId" in optionsOrInjectionId
      ? optionsOrInjectionId
      : { injectionId: optionsOrInjectionId as ServiceIdentifier<T> };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T>
  ): void => {
    const { injectionId, once } = options;

    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (container) => {
            protoOrTarget.set.call(this, container.get(injectionId));
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
            (element as AnyObject)[nameOrContext] = container.get(injectionId);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
