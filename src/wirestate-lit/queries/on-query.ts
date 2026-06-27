import { type ReactiveElement } from "@lit/reactive-element";
import { type QueryType } from "@wirestate/core";

import { type AnyObject, type Interface, type MaybePromise } from "../types/general";

import { OnQueryController } from "./on-query-controller";

/**
 * Describes type returned by {@link onQuery}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Queries
 */
export interface OnQueryDecorator<R = unknown, P = unknown, T extends QueryType = QueryType> {
  readonly type?: T;
  // Standard (TC39):
  <This extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: (this: This, payload: P) => MaybePromise<R>,
    context: ClassMethodDecoratorContext<This>
  ): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Decorator for Lit element methods that handle a specific query.
 *
 * @remarks
 * The handler is registered when the host connects, unregistered when it
 * disconnects, and re-registered when the nearest container context changes.
 * Query handlers are stack-based on the active query bus.
 *
 * @group Queries
 *
 * @param type - Query type to handle.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onQuery("GET_USER_NAME")
 *   private onGetUserName(payload: QueryPayload) {
 *     return "Alice";
 *   }
 * }
 * ```
 */
export function onQuery<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T): OnQueryDecorator<R, P, T> {
  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        new OnQueryController<R, P, T>(
          this as ReactiveElement,
          type,
          (payload: P) => (this as AnyObject)[nameOrContext.name](payload) as MaybePromise<R>
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnQueryController<R, P, T>(
          element,
          type,
          (payload: P) => (element as AnyObject)[nameOrContext](payload) as MaybePromise<R>
        );
      });
    }
  }) as OnQueryDecorator<R, P, T>;
}
