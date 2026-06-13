import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Identifier } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { AnyObject, FieldMustMatchProvidedType, Interface } from "../types/general";

/**
 * Describes type returned by {@link injection}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Consumption
 */
export interface InjectionDecorator<T> {
  // Standard, `accessor` declarations. The `set` parameter enforces that the
  // injected value is assignable to the accessor type, so wider accessors are accepted.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: Omit<ClassAccessorDecoratorContext<C, V>, "access"> & {
      readonly access: { readonly set: (object: C, value: T) => void };
    }
  ): void;
  // Standard, plain field declarations. The `set` parameter enforces that the
  // injected value is assignable to the field type, so wider fields are accepted.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: undefined,
    context: Omit<ClassFieldDecoratorContext<C, T>, "access"> & {
      readonly access: { readonly set: (object: C, value: T) => void };
    }
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, T>;
}

/**
 * Describes options for {@link injection}.
 *
 * @group Consumption
 */
export interface InjectionOptions<T> {
  /**
   * The token to inject.
   */
  token: Identifier<T>;
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the property will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;
}

/**
 * Injects a container value into a Lit element property.
 *
 * @remarks
 * The property follows the nearest container context unless `once` is `true`.
 *
 * @group Consumption
 *
 * @param optionsOrToken - Service token or options.
 * @returns Lit property decorator.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection(MyService)
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection({ token: MyService, once: true })
 *   private myService!: MyService;
 *
 *   public render() {
 *     return html`<div>${this.myService.getName()}</div>`;
 *   }
 * }
 * ```
 */
export function injection<T>(optionsOrToken: InjectionOptions<T> | Identifier<T>): InjectionDecorator<T> {
  const options: InjectionOptions<T> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as Identifier<T> };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T>
  ): void => {
    const { once, token } = options;

    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (container) => {
            nameOrContext.access.set(this, container.get(token));
          },
          subscribe: !once,
        });
      });
    } else {
      // Experimental decorators branch.
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        new ContextConsumer(element, {
          context: ContainerContext,
          callback: (container) => {
            (element as AnyObject)[nameOrContext] = container.get(token);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T>;
}
