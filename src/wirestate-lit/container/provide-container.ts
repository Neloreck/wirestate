import { type ReactiveElement } from "@lit/reactive-element";

import {
  type FieldMustMatchProvidedType,
  type Interface,
  type Maybe,
  type ProvidedTypeMustMatch,
} from "../types/general";

import { type ContainerProviderOptions, ContainerProvider } from "./container-provider";

/**
 * Describes the type returned by {@link provideContainer}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Container
 */
export interface ProvideContainerDecorator<E extends ReactiveElement = ReactiveElement> {
  // Standard, `accessor` declarations. Wider accessor types are accepted; the
  // provider must be assignable to the accessor type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V> & ProvidedTypeMustMatch<ContainerProvider<E>, V>
  ): void;
  // Standard, plain field declarations. Wider field types are accepted; the
  // provider must be assignable to the field type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: undefined,
    context: ClassFieldDecoratorContext<C, V> & ProvidedTypeMustMatch<ContainerProvider<E>, V>
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
 * @group Container
 *
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.config - Managed container creation config.
 * @returns An instance of {@link ProvideContainerDecorator}.
 *
 * @example
 * ```typescript
 * import { EventBus } from "@wirestate/core";
 * import { ContainerProvider, provideContainer } from "@wirestate/lit";
 * import { LitElement } from "lit";
 *
 * class MyRootElement extends LitElement {
 *   @provideContainer({
 *     config: {
 *       bindings: [LoggerService, EventBus],
 *     },
 *   })
 *   private containerProvider!: ContainerProvider;
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { Container } from "@wirestate/core";
 * import { ContainerProvider, provideContainer } from "@wirestate/lit";
 * import { LitElement } from "lit";
 *
 * const container = new Container({ bindings: [LoggerService] });
 *
 * class MyRootElement extends LitElement {
 *   @provideContainer({ container })
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
        nameOrContext.access.set(this, new ContainerProvider(this as unknown as E, options));
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
