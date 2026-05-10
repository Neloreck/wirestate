import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/ioc-context";
import { FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * @group consumption
 */
export type InjectionDecorator<ValueType> = {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends ValueType>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ValueType>;
};

/**
 * @group consumption
 */
export interface InjectionOptions<T> {
  injectionId: ServiceIdentifier<T>;
  subscribe?: boolean;
}

/**
 * @param root0
 * @param root0.injectionId
 * @param root0.subscribe
 * @group consumption
 */
export function injection<T>({ injectionId, subscribe }: InjectionOptions<T>): InjectionDecorator<T> {
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
          subscribe,
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
          subscribe,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
