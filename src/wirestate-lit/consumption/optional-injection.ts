import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, ServiceIdentifier } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { AnyObject, FieldMustMatchProvidedType, Interface, Optional } from "../types/general";

import type { OptionalInjectionFallback } from "./use-optional-injection";

/**
 * Represents definition of the optional injection decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Consumption
 */
export interface OptionalInjectionDecorator<T> {
  // Standard:
  <C extends Interface<Omit<ReactiveElement, "renderRoot">>, V extends Optional<T>>(
    value: ClassAccessorDecoratorTarget<C, V>,
    context: ClassAccessorDecoratorContext<C, V>
  ): void;
  // Legacy:
  <K extends PropertyKey, Proto extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    protoOrDescriptor: Proto,
    name?: K
  ): FieldMustMatchProvidedType<Proto, K, Optional<T>>;
}

/**
 * Represents options for the {@link optionalInjection} decorator.
 *
 * @group Consumption
 */
export interface OptionalInjectionOptions<T> {
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
  onFallback?: OptionalInjectionFallback<T>;
}

/**
 * Decorator to optionally inject a service from the IoC container into a Lit element property.
 *
 * @remarks
 * Unlike {@link injection}, this decorator assigns `null` when the dependency
 * is missing from the container and no fallback is provided.
 *
 * @group Consumption
 *
 * @param optionsOrInjectionId - Injection options or service identifier.
 * @param onFallback - Optional function called to provide a value if the token is not bound.
 * @returns An instance of {@link OptionalInjectionDecorator}.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @optionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService))
 *   private logger: Logger | null = null;
 * }
 * ```
 */
export function optionalInjection<T>(
  optionsOrInjectionId: OptionalInjectionOptions<T> | ServiceIdentifier<T>,
  onFallback?: OptionalInjectionFallback<T>
): OptionalInjectionDecorator<T> {
  const options: OptionalInjectionOptions<T> =
    typeof optionsOrInjectionId === "object" && optionsOrInjectionId !== null && "injectionId" in optionsOrInjectionId
      ? optionsOrInjectionId
      : { injectionId: optionsOrInjectionId as ServiceIdentifier<T>, onFallback };

  return ((
    protoOrTarget: ClassAccessorDecoratorTarget<ReactiveElement, Optional<T>>,
    nameOrContext: PropertyKey | ClassAccessorDecoratorContext<ReactiveElement, Optional<T>>
  ): void => {
    const { injectionId, once } = options;
    const fallback: Optional<OptionalInjectionFallback<T>> = options.onFallback ?? onFallback ?? null;

    const resolve = (container: Container): Optional<T> => {
      if (container.isBound(injectionId)) {
        return container.get(injectionId);
      }

      return fallback ? fallback(container) : null;
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
  }) as OptionalInjectionDecorator<T>;
}
