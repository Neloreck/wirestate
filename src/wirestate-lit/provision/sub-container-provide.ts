import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { SubContainerProvider, SubContainerProviderOptions } from "./sub-container-provider";

/**
 * Represents type returned by {@link subContainerProvide}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface SubContainerProviderDecorator<T extends ReactiveElement = ReactiveElement> {
  // Standard (TC39):
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends SubContainerProvider<T>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, SubContainerProvider<T>>;
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
 * @param options.config - Child-container creation options.
 * @returns An instance of {@link SubContainerProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   @subContainerProvide({
 *     config: {
 *       entries: [AuthService, UserService],
 *       activate: [AuthService],
 *     },
 *   })
 *   public containerProvider!: SubContainerProvider<MyComponent>;
 * }
 * ```
 */
export function subContainerProvide<E extends ReactiveElement = ReactiveElement>(
  options: SubContainerProviderOptions
): SubContainerProviderDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, SubContainerProvider<ReactiveElement>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, SubContainerProvider<ReactiveElement>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new SubContainerProvider(this as ReactiveElement, options));
      });
    } else {
      let provider: Maybe<SubContainerProvider<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        provider = new SubContainerProvider(element as E, options);
      });

      return {
        get(this: ReactiveElement): SubContainerProvider<E> {
          return provider as SubContainerProvider<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as SubContainerProviderDecorator<E>;
}
