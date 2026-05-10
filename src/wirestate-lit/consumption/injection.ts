import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/ioc-context";
import { FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * Type definition for the injection decorator.
 *
 * @group consumption
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
 * Options for the {@link injection} decorator.
 *
 * @group consumption
 */
export interface InjectionOptions<T> {
  /**
   * The service identifier to inject from the IoC container.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * Whether to subscribe to changes in the context.
   *
   * If true, the property will be updated if the container in the context changes.
   * False by default.
   */
  once?: boolean;
}

/**
 * Decorator to inject a service from the IoC container into a Lit element property.
 *
 * @group consumption
 *
 * @param options - injection options including the service identifier
 * @param options.injectionId - the service identifier to inject from the IoC container
 * @param options.once - whether to subscribe to changes in the context, if false, the property will be updated if the container in the context changes
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection({ injectionId: MyService })
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function injection<T>({ injectionId, once }: InjectionOptions<T>): InjectionDecorator<T> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T>
  ) => {
    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
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
          context: ContainerContext,
          callback: (it) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element as any)[nameOrContext] = it.container.get(injectionId);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
