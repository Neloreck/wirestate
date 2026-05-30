import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { ChildContainerProvider, ChildContainerProviderOptions } from "./child-container-provider";

/**
 * Represents type returned by {@link provideChildContainer}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface ProvideChildContainerDecorator<T extends ReactiveElement = ReactiveElement> {
  // Standard (TC39):
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends ChildContainerProvider<T>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ChildContainerProvider<T>>;
}

/**
 * Decorator that provides a managed child container derived from the nearest
 * parent container context.
 *
 * @remarks
 * The child container is created from the current parent context when the host
 * connects, provider lifecycle hooks run while connected, destroyed when it
 * disconnects, and recreated when the parent container changes.
 *
 * The child container value is published through Lit context only while the
 * host is connected. Before the first connection and after disconnection, the
 * provider value is `undefined`.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.config - Child container creation options.
 * @returns An instance of {@link ProvideChildContainerDecorator}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   @provideChildContainer({
 *     config: {
 *       activate: [AuthService],
 *       bindings: [AuthService, UserService],
 *     },
 *   })
 *   public containerProvider!: ChildContainerProvider<MyComponent>;
 * }
 * ```
 */
export function provideChildContainer<E extends ReactiveElement = ReactiveElement>(
  options: ChildContainerProviderOptions
): ProvideChildContainerDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, ChildContainerProvider<ReactiveElement>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, ChildContainerProvider<ReactiveElement>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new ChildContainerProvider(this as ReactiveElement, options));
      });
    } else {
      let provider: Maybe<ChildContainerProvider<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        provider = new ChildContainerProvider(element as E, options);
      });

      return {
        get(this: ReactiveElement): ChildContainerProvider<E> {
          return provider as ChildContainerProvider<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as ProvideChildContainerDecorator<E>;
}
