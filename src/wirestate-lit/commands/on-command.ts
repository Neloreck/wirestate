import { ReactiveElement } from "@lit/reactive-element";
import { CommandType } from "@wirestate/core";

import { AnyObject, Interface, MaybePromise } from "../types/general";

import { OnCommandController } from "./on-command-controller";

/**
 * Describes type returned by {@link onCommand}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Commands
 */
export interface OnCommandDecorator<D = unknown, R = unknown> {
  // Standard (TC39):
  <This extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: (this: This, payload: D) => MaybePromise<R>,
    context: ClassMethodDecoratorContext<This>
  ): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Decorator for Lit element methods that handle a specific command.
 *
 * @remarks
 * The handler is registered when the host connects and unregistered when it disconnects.
 *
 * @group Commands
 *
 * @param type - Unique identifier of the command to handle.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onCommand("SAVE")
 *   private onSave(payload: SomeData): void {
 *     // handle command
 *   }
 * }
 * ```
 */
export function onCommand<D = unknown, R = unknown>(type: CommandType): OnCommandDecorator<D, R> {
  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        new OnCommandController<D, R>(
          this as ReactiveElement,
          type,
          (payload: D) => (this as AnyObject)[nameOrContext.name](payload) as MaybePromise<R>
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnCommandController<D, R>(
          element,
          type,
          (payload: D) => (element as AnyObject)[nameOrContext](payload) as MaybePromise<R>
        );
      });
    }
  }) as OnCommandDecorator<D, R>;
}
