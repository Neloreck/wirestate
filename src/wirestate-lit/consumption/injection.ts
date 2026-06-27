import { ContextConsumer } from "@lit/context";
import { type ReactiveElement } from "@lit/reactive-element";
import { type Container, type ServiceToken } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import {
  type AnyObject,
  type FieldMustMatchProvidedType,
  type Interface,
  type Optional,
  type ProvidedTypeMustMatch,
} from "../types/general";

import { type InjectionFallback } from "./use-injection";

/**
 * Describes type returned by {@link injection}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators. The type parameter is
 * the resolved value type - `T` for a required injection, `T | undefined` for an
 * optional one, or `T | F` when a fallback is given.
 *
 * @group Consumption
 */
export interface InjectionDecorator<T> {
  // Standard, `accessor` declarations. Wider accessor types are accepted; the
  // injected value must be assignable to the accessor type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V> & ProvidedTypeMustMatch<T, V>
  ): void;
  // Standard, plain field declarations. Wider field types are accepted; the
  // injected value must be assignable to the field type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: undefined,
    context: ClassFieldDecoratorContext<C, V> & ProvidedTypeMustMatch<T, V>
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
export interface InjectionOptions<T, F = undefined> {
  /**
   * The token to inject.
   */
  token: ServiceToken<T>;

  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the property will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;

  /**
   * Resolve `undefined` instead of throwing when the token is not bound.
   */
  optional?: boolean;

  /**
   * Value used when the token is not bound. Providing it makes the lookup optional.
   */
  fallback?: InjectionFallback<F>;
}

/**
 * Injects a container value into a Lit element property.
 *
 * @remarks
 * Follows the nearest container context unless `once` is set. Throws when the
 * token is not bound. Pass `optional` to assign `undefined` on a miss, or a
 * `fallback` (which implies `optional`) to assign a default.
 *
 * @group Consumption
 *
 * @param token - Token to inject, or options carrying the token plus `once`/`optional`/`fallback`.
 * @returns Lit property decorator.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @injection(MyService)
 *   private service!: MyService;
 *
 *   @injection({ token: MyService, optional: true })
 *   private maybeService?: MyService;
 *
 *   @injection({ token: UserName, fallback: "guest" })
 *   private name!: string;
 * }
 * ```
 */
export function injection<T>(token: ServiceToken<T>): InjectionDecorator<T>;
export function injection<T>(options: {
  token: ServiceToken<T>;
  once?: boolean;
  optional?: false;
  fallback?: undefined;
}): InjectionDecorator<T>;
export function injection<T>(options: {
  token: ServiceToken<T>;
  once?: boolean;
  optional: true;
  fallback?: undefined;
}): InjectionDecorator<Optional<T>>;
export function injection<T, F>(options: {
  token: ServiceToken<T>;
  once?: boolean;
  optional?: boolean;
  fallback: InjectionFallback<F>;
}): InjectionDecorator<T | F>;
export function injection<T, F = undefined>(
  optionsOrToken: InjectionOptions<T, F> | ServiceToken<T>
): InjectionDecorator<T | F> {
  const options: InjectionOptions<T, F> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceToken<T> };

  const { once, token, optional, fallback } = options;

  function resolve(container: Container): T | F {
    // Required lookup (neither optional nor fallback): resolve directly so the container throws on a miss.
    if (!optional && fallback === undefined) {
      return container.get(token);
    }

    if (container.has(token)) {
      return container.get(token);
    }

    if (fallback !== undefined) {
      return typeof fallback === "function" ? (fallback as (container: Container) => F)(container) : fallback;
    }

    return undefined as F;
  }

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T | F>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T | F>
  ): void => {
    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (container) => {
            nameOrContext.access.set(this, resolve(container));
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
            (element as AnyObject)[nameOrContext] = resolve(container);
          },
          subscribe: !once,
        });
      });
    }
  }) as InjectionDecorator<T | F>;
}
