import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import {
  SubContainerProviderController,
  SubContainerProviderControllerOptions,
} from "./sub-container-provider-controller";

/**
 * Represents type for the {@link subContainerProvide} decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface SubContainerProviderDecorator<T extends ReactiveElement = ReactiveElement> {
  // Standard (TC39):
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends SubContainerProviderController<T>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, SubContainerProviderController<T>>;
}

/**
 * Decorator that provides a managed child container derived from the nearest
 * parent container context.
 *
 * @remarks
 * The child container is created from the current parent context when the host
 * connects, destroyed when it disconnects, and recreated when the parent
 * container changes.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.options - Child-container creation options.
 * @returns An instance of {@link SubContainerProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   @subContainerProvide({
 *     options: {
 *       entries: [AuthService, UserService],
 *       activate: [AuthService],
 *     },
 *   })
 *   public controller!: SubContainerProviderController<MyComponent>;
 * }
 * ```
 */
export function subContainerProvide<E extends ReactiveElement = ReactiveElement>(
  options: SubContainerProviderControllerOptions
): SubContainerProviderDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, SubContainerProviderController<ReactiveElement>>,
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<ReactiveElement, SubContainerProviderController<ReactiveElement>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new SubContainerProviderController(this as ReactiveElement, options));
      });
    } else {
      let controller: Maybe<SubContainerProviderController<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        controller = new SubContainerProviderController(element as E, options);
      });

      return {
        get(this: ReactiveElement): SubContainerProviderController<E> {
          return controller as SubContainerProviderController<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as SubContainerProviderDecorator<E>;
}
