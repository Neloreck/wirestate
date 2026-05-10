import { ReactiveElement } from "@lit/reactive-element";

import { FieldMustMatchProvidedType, Interface } from "../types/general";

import { IocProviderController, IocProviderControllerOptions } from "./ioc-provider-controller";

/**
 * Type definition for the ioc-provide decorator.
 *
 * @group provision
 */
export interface IocProviderDecorator {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends IocProviderController>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy/experimental:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, IocProviderController>;
}

/**
 * Decorator to provide an IoC container to child components.
 *
 * @group provision
 *
 * @param options - provisioning options including container and seed data
 * @param options.container - optional existing container to use, if not provided, a new one will be created
 * @param options.seed - optional seed data to apply to the container
 * @returns IOC provision controller instance
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   @iocProvide({ seed: { someData: 'value' } })
 *   private ioc!: IocProviderController;
 * }
 * ```
 */
export function iocProvide({ container, seed }: IocProviderControllerOptions = {}): IocProviderDecorator {
  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, IocProviderController>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, IocProviderController>
  ) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        protoOrTarget.set.call(
          this,
          new IocProviderController(this as unknown as ReactiveElement, { container, seed })
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any)[nameOrContext] = new IocProviderController(element, { container, seed });
      });
    }
  }) as IocProviderDecorator;
}
