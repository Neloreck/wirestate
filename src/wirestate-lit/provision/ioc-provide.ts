import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface, Maybe } from "../types/general";

import { IocProviderController, IocProviderControllerOptions } from "./ioc-provider-controller";

/**
 * Type definition for the ioc-provide decorator.
 *
 * @group provision
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
 * Decorator to provide an IoC container to child components.
 *
 * @group provision
 *
 * @param options - Provisioning options including container and seed data.
 * @param options.container - Optional existing container to use, if not provided, a new one will be created.
 * @param options.seed - Optional seed data to apply to the container.
 * @returns IOC provision controller instance.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @iocProvide({ seed: { someData: 'value' } })
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
