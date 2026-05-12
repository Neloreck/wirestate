import { ReactiveElement } from "@lit/reactive-element";
import { QueryType } from "@wirestate/core";

import { AnyObject, Interface, MaybePromise } from "../types/general";

import { OnQueryController } from "./on-query-controller";

/**
 * Represents interface for the {@link onQuery} decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Queries
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
 * Decorator for Lit element methods that handle a specific query.
 *
 * @remarks
 * The handler is registered when the host connects and unregistered when it disconnects.
 *
 * @group Queries
 *
 * @param type - Unique identifier of the query to handle.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onQuery("GET_USER_NAME")
 *   private onGetUserName(data: QueryData) {
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
