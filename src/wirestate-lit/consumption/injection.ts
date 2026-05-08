import { ContextConsumer } from "@lit/context";
import { ServiceIdentifier } from "@wirestate/core";
import { ReactiveElement } from "lit";

import { ContainerContext } from "../provision/ioc-provider-context";
import { FieldMustMatchProvidedType, Interface } from "../types/general";

export type InjectionDecorator<ValueType> = {
  // Legacy.
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ValueType>;
  // Standard.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends ValueType>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
};

export function injection<T>({
  injectionId,
  subscribe,
}: {
  injectionId: ServiceIdentifier<T>;
  subscribe?: boolean;
}): InjectionDecorator<T> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T>
  ) => {
    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (value) => {
            protoOrTarget.set.call(this, value.get(injectionId));
          },
          subscribe,
        });
      });
    } else {
      // Experimental decorators branch.
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(element, {
          context: ContainerContext,
          callback: (value) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (element as any)[nameOrContext] = value.get(injectionId);
          },
          subscribe,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
