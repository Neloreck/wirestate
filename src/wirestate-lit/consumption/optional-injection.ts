import { ContextConsumer } from "@lit/context";
import { type ReactiveElement } from "@lit/reactive-element";
import { type Container, type ServiceToken } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import {
  type AnyObject,
  type Optional,
  type FieldMustMatchProvidedType,
  type Interface,
  type ProvidedTypeMustMatch,
} from "../types/general";

import { type OptionalInjectionFallback } from "./use-optional-injection";

/**
 * Describes type returned by {@link optionalInjection}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Consumption
 */
export interface OptionalInjectionDecorator<T, F = undefined> {
  // Standard, `accessor` declarations. Wider accessor types are accepted; the
  // injected or fallback value must be assignable to the accessor type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V> & ProvidedTypeMustMatch<T | F, V>
  ): void;
  // Standard, plain field declarations. Wider field types are accepted; the
  // injected or fallback value must be assignable to the field type.
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V>(
    value: undefined,
    context: ClassFieldDecoratorContext<C, V> & ProvidedTypeMustMatch<T | F, V>
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, T | F>;
}

/**
 * Describes options for {@link optionalInjection}.
 *
 * @group Consumption
 */
export interface OptionalInjectionOptions<T, F = undefined> {
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
   * Provides a value when the token is not bound.
   */
  fallback?: OptionalInjectionFallback<F>;
}

/**
 * Injects a container value if it exists.
 *
 * @remarks
 * Missing token means the fallback result, or `undefined` when no fallback exists.
 * The fallback is a raw value (returned as-is) or a `(container) => value` factory
 * (called lazily). A bare function is always treated as the factory — wrap a
 * function fallback value as `() => fn`.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The fallback value type (a raw value or a factory result).
 *
 * @param optionsOrToken - Service token or options.
 * @param fallback - Raw value or `(container) => value` factory, used when the token is not bound.
 * @returns Lit property decorator.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   // Raw value fallback.
 *   @optionalInjection(UserName, "guest")
 *   private name: string = "guest";
 *
 *   // Factory fallback (lazy, receives the container).
 *   @optionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService))
 *   private logger: Logger | undefined = undefined;
 * }
 * ```
 */
export function optionalInjection<T, F = undefined>(
  optionsOrToken: OptionalInjectionOptions<T, F> | ServiceToken<T>,
  fallback?: OptionalInjectionFallback<F>
): OptionalInjectionDecorator<T, F> {
  const options: OptionalInjectionOptions<T, F> =
    typeof optionsOrToken === "object" && optionsOrToken !== null && "token" in optionsOrToken
      ? optionsOrToken
      : { token: optionsOrToken as ServiceToken<T>, fallback: fallback };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T | F>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T | F>
  ): void => {
    const { once, token } = options;
    const resolvedFallback: Optional<OptionalInjectionFallback<F>> =
      options.fallback !== undefined ? options.fallback : fallback;

    function resolve(container: Container): T | F {
      if (container.has(token)) {
        return container.get(token);
      }

      if (resolvedFallback !== undefined) {
        return typeof resolvedFallback === "function"
          ? (resolvedFallback as (container: Container) => F)(container)
          : (resolvedFallback as F);
      }

      return undefined as F;
    };

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
  }) as OptionalInjectionDecorator<T, F>;
}
