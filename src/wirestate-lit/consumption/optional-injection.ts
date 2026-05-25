import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { AnyObject, FieldMustMatchProvidedType, Interface, Optional } from "../types/general";

import type { OptionalInjectionFallback } from "./use-optional-injection";

/**
 * Represents type returned by {@link optionalInjection}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Consumption
 */
export interface OptionalInjectionDecorator<T, F = null> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends T | F>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, T | F>;
}

/**
 * Represents options for {@link optionalInjection}.
 *
 * @group Consumption
 */
export interface OptionalInjectionOptions<T, F = null> {
  /**
   * The service identifier to inject.
   */
  injectionId: ServiceIdentifier<T>;
  /**
   * Resolve only the first context value.
   *
   * @remarks
   * If true, the property will not update when the container context changes.
   * Defaults to `false`.
   */
  once?: boolean;
  /**
   * Provides a value when the service identifier is not bound.
   */
  onFallback?: OptionalInjectionFallback<F>;
}

/**
 * Injects a container value if it exists.
 *
 * @remarks
 * Missing token means fallback result, or `null` when no fallback exists.
 *
 * @group Consumption
 *
 * @template T - The type of the value being resolved.
 * @template F - The type returned by the fallback function.
 *
 * @param optionsOrInjectionId - Service token or options.
 * @param onFallback - Fallback for missing bindings.
 * @returns Lit property decorator.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @optionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService))
 *   private logger: Logger | null = null;
 * }
 * ```
 */
export function optionalInjection<T, F = null>(
  optionsOrInjectionId: OptionalInjectionOptions<T, F> | ServiceIdentifier<T>,
  onFallback?: OptionalInjectionFallback<F>
): OptionalInjectionDecorator<T, F> {
  const options: OptionalInjectionOptions<T, F> =
    typeof optionsOrInjectionId === "object" && optionsOrInjectionId !== null && "injectionId" in optionsOrInjectionId
      ? optionsOrInjectionId
      : { injectionId: optionsOrInjectionId as ServiceIdentifier<T>, onFallback };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, T | F>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, T | F>
  ): void => {
    const { injectionId, once } = options;
    const fallback: Optional<OptionalInjectionFallback<F>> = options.onFallback ?? onFallback ?? null;

    const resolve = (container: Container): T | F => {
      if (container.isBound(injectionId)) {
        return container.get(injectionId);
      }

      return fallback ? fallback(container) : (null as F);
    };

    // Standard decorators branch.
    if (typeof nameOrContext === "object") {
      nameOrContext.addInitializer(function () {
        new ContextConsumer(this, {
          context: ContainerContext,
          callback: (container) => {
            protoOrTarget.set.call(this, resolve(container));
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
