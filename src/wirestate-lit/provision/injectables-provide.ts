import { ReactiveElement } from "@lit/reactive-element";

import { AnyObject, FieldMustMatchProvidedType, Interface } from "../types/general";

import { InjectablesProviderController, InjectablesProviderControllerOptions } from "./injectables-provider-controller";

/**
 * Type for the {@link injectablesProvide} decorator.
 *
 * Supports both standard (TC39) and legacy experimental decorators.
 *
 * @group provision
 */
export interface InjectablesProviderDecorator<T extends ReactiveElement = ReactiveElement> {
  // Standard (TC39):
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends InjectablesProviderController<T>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, InjectablesProviderController<T>>;
}

/**
 * Decorator that binds a set of injectables to the nearest IoC container for the host element's lifetime.
 *
 * Entries are bound when the host connects and unbound when it disconnects.
 * The decorated accessor or property holds the resulting {@link InjectablesProviderController} instance.
 *
 * @group provision
 *
 * @param options - provisioning options
 * @returns injectables provider decorator instance
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   @injectablesProvide({ entries: [AuthService, UserService], activate: [AuthService] })
 *   public services!: InjectablesProviderController<MyComponent>;
 * }
 * ```
 */
export function injectablesProvide<E extends ReactiveElement = ReactiveElement>(
  options: InjectablesProviderControllerOptions
): InjectablesProviderDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, InjectablesProviderController<ReactiveElement>>,
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<ReactiveElement, InjectablesProviderController<ReactiveElement>>
  ): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new InjectablesProviderController(this as ReactiveElement, options));
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        const controller: InjectablesProviderController = new InjectablesProviderController(
          element as ReactiveElement,
          options
        );

        element.addController({
          hostConnected(): void {
            (element as AnyObject)[nameOrContext] = controller;
          },
        });
      });
    }
  }) as InjectablesProviderDecorator<E>;
}
