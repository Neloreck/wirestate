import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { ContainerProvider, ContainerProviderOptions } from "./container-provider";

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
 * - Pass `config` to create a managed container during construction,
 *   activate configured entries on connect, run provider lifecycle hooks while
 *   connected, destroy it on disconnect, and recreate it on reconnect.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.config - Managed container creation config.
 * @returns An instance of {@link ContainerProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @containerProvide({
 *     config: {
 *       seed: { someData: "value" },
 *       entries: [LoggerService],
 *     },
 *   })
 *   private containerProvider!: ContainerProvider;
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @containerProvide({ container: container })
 *   private containerProvider!: ContainerProvider;
 * }
 * ```
 */
export function containerProvide<E extends ReactiveElement>(
  options: ContainerProviderOptions
): ContainerProviderDecorator<E> {
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
      let controller: Maybe<ContainerProvider<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        controller = new ContainerProvider(element as E, options);
      });

      return {
        get(this: ReactiveElement): ContainerProvider<E> {
          return controller as ContainerProvider<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as ContainerProviderDecorator<E>;
}
