import { ReactiveElement } from "@lit/reactive-element";
import { QueryType } from "@wirestate/core";

import { AnyObject, Interface, MaybePromise } from "../types/general";

import { OnQueryController } from "./on-query-controller";

/**
 * Interface for the {@link onQuery} decorator.
 *
 * Supports both standard (TC39) and legacy experimental decorators.
 *
 * @group queries
 */
export interface OnQueryDecorator<D = unknown, R = unknown> {
  // Standard (TC39):
  <This extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: (this: This, data: D) => MaybePromise<R>,
    context: ClassMethodDecoratorContext<This>
  ): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Decorator that registers a Lit element method as a query handler for the given type.
 *
 * The handler is registered when the host element connects to the DOM and unregistered when it disconnects.
 *
 * @group queries
 *
 * @param type - The query type to handle.
 * @returns The decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onQuery("GET_USER_NAME")
 *   public onGetUserName(data: QueryData) {
 *     return "Alice";
 *   }
 * }
 * ```
 */
export function onQuery<D = unknown, R = unknown>(type: QueryType): OnQueryDecorator<D, R> {
  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        new OnQueryController<D, R>(
          this as ReactiveElement,
          type,
          (data: D) => (this as AnyObject)[nameOrContext.name](data) as MaybePromise<R>
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnQueryController<D, R>(
          element,
          type,
          (data: D) => (element as AnyObject)[nameOrContext](data) as MaybePromise<R>
        );
      });
    }
  }) as OnQueryDecorator<D, R>;
}
