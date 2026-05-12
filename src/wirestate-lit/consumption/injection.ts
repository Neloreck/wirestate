import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { IocContextObject } from "../context/ioc-context";
import { AnyObject, FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * Represents definition of the injection decorator.
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
 * Represents options for the {@link injection} decorator.
 *
 * @group Consumption
 */
export interface InjectionOptions<T> {
  /**
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * Whether to subscribe to container changes.
   *
   * @remarks
   * If true, the property will be updated if the container in the context changes.
   * Defaults to false.
   */
  once?: boolean;
}

/**
 * Decorator to inject a service from the IoC container into a Lit element property.
 *
 * @group Consumption
 *
 * @param optionsOrInjectionId - Injection options or service identifier.
 * @returns An instance of {@link InjectionDecorator}.
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
          context: IocContextObject,
          callback: (it) => {
            protoOrTarget.set.call(this, it.container.get(injectionId));
          },
          subscribe: !once,
        });
      });
    } else {
      // Experimental decorators branch.
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(element, {
          context: IocContextObject,
          callback: (it) => {
            (element as AnyObject)[nameOrContext] = it.container.get(injectionId);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
