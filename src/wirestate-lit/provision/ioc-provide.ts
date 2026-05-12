import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { IocProviderController, IocProviderControllerOptions } from "./ioc-provider-controller";

/**
 * Represents interface for the {@link iocProvide} decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Provision
 */
export interface IocProviderDecorator<E extends ReactiveElement = ReactiveElement> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends IocProviderController<E>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, IocProviderController<E>>;
}

/**
 * Decorator that provides an IoC container to child components.
 *
 * @remarks
 * The container is provided via Lit context. It is created (or used from options) when the host connects.
 *
 * @group Provision
 *
 * @param options - Provisioning options.
 * @param options.container - Optional existing container to use, if not provided, a new one will be created.
 * @param options.seed - Optional seed data to apply to the container.
 * @returns An instance of {@link IocProviderDecorator}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @iocProvide({ seed: { someData: "value" } })
 *   private ioc!: IocProviderController;
 * }
 * ```
 */
export function iocProvide<E extends ReactiveElement>({
  container,
  seed,
}: IocProviderControllerOptions = {}): IocProviderDecorator<E> {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, IocProviderController<E>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, IocProviderController<E>>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(this, new IocProviderController(this as unknown as E, { container, seed }));
      });
    } else {
      let controller: Maybe<IocProviderController<E>>;

      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        controller = new IocProviderController(element as E, { container, seed });
      });

      return {
        get(this: ReactiveElement): IocProviderController<E> {
          return controller as IocProviderController<E>;
        },
        set(): void {},
        configurable: true,
        enumerable: true,
      };
    }
  }) as IocProviderDecorator<E>;
}
