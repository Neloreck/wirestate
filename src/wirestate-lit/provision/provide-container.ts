import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { ContainerProvider, ContainerProviderOptions } from "./container-provider";

/**
 * Describes the type returned by {@link provideContainer}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface ProvideContainerDecorator<E extends ReactiveElement = ReactiveElement> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends ContainerProvider<E>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, ContainerProvider<E>>;
}

/**
 * Decorator that provides an IoC container to child components.
 *
 * @remarks
 * The container is provided via Lit context.
 *
 * - Pass `container` to expose an external container without taking
 *   ownership.
 * - Pass `config` to create a managed container when the host connects, run
 *   provider lifecycle hooks while connected, destroy it on disconnect, and
 *   recreate it on reconnect.
 *
 * The container value is published through Lit context only while the host is
 * connected. Before the first connection and after disconnection, the provider
 * value is `undefined`.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.config - Managed container creation config.
 * @returns An instance of {@link ProvideContainerDecorator}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @provideContainer({
 *     config: {
 *       bindings: [LoggerService],
 *       seed: { someData: "value" },
 *     },
 *   })
 *   private containerProvider!: ContainerProvider;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @provideContainer({ container: container })
 *   private containerProvider!: ContainerProvider;
 * }
 * ```
 */
export function provideContainer<E extends ReactiveElement>(
  options: ContainerProviderOptions
): ProvideContainerDecorator<E> {
  const controllerKey: unique symbol = Symbol("@wirestate/lit/provide-container");

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, ContainerProvider<E>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, ContainerProvider<E>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new ContainerProvider(this as unknown as E, options));
      });
    } else {
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        (element as ReactiveElement & Record<typeof controllerKey, Maybe<ContainerProvider<E>>>)[controllerKey] =
          new ContainerProvider(element as E, options);
      });

      return {
        get(this: ReactiveElement): ContainerProvider<E> {
          return (this as ReactiveElement & Record<typeof controllerKey, ContainerProvider<E>>)[controllerKey];
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as ProvideContainerDecorator<E>;
}
