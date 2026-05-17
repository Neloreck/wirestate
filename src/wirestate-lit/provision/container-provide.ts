import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { ContainerProviderController, ContainerProviderControllerOptions } from "./container-provider-controller";

/**
 * Represents interface for the {@link containerProvide} decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface ContainerProviderDecorator<E extends ReactiveElement = ReactiveElement> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends ContainerProviderController<E>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ContainerProviderController<E>>;
}

/**
 * Decorator that provides an IoC container to child components.
 *
 * @remarks
 * The container is provided via Lit context.
 *
 * - Pass `container` to expose an external container without taking
 *   ownership.
 * - Pass `options` to create a managed container during construction,
 *   activate configured entries on connect, destroy it on disconnect, and
 *   recreate it on reconnect.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.options - Managed container creation options.
 * @returns An instance of {@link ContainerProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @containerProvide({
 *     options: {
 *       seed: { someData: "value" },
 *       entries: [LoggerService],
 *     },
 *   })
 *   private container!: ContainerProviderController;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @containerProvide({ container: container })
 *   private container!: ContainerProviderController;
 * }
 * ```
 */
export function containerProvide<E extends ReactiveElement>(
  options: ContainerProviderControllerOptions
): ContainerProviderDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, ContainerProviderController<E>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, ContainerProviderController<E>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new ContainerProviderController(this as unknown as E, options));
      });
    } else {
      let controller: Maybe<ContainerProviderController<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        controller = new ContainerProviderController(element as E, options);
      });

      return {
        get(this: ReactiveElement): ContainerProviderController<E> {
          return controller as ContainerProviderController<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as ContainerProviderDecorator<E>;
}
