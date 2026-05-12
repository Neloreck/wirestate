import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { InjectablesProviderController, InjectablesProviderControllerOptions } from "./injectables-provider-controller";

/**
 * Represents type for the {@link injectablesProvide} decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
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
 * @remarks
 * Entries are bound when the host connects and unbound when it disconnects.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @returns An instance of {@link InjectablesProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   @injectablesProvide({ entries: [AuthService, UserService], activate: [AuthService] })
 *   public controller!: InjectablesProviderController<MyComponent>;
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
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new InjectablesProviderController(this as ReactiveElement, options));
      });
    } else {
      let controller: Maybe<InjectablesProviderController<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        controller = new InjectablesProviderController(element as E, options);
      });

      return {
        get(this: ReactiveElement): InjectablesProviderController<E> {
          return controller as InjectablesProviderController<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as InjectablesProviderDecorator<E>;
}
