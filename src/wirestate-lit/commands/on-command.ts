import { type ReactiveElement } from "@lit/reactive-element";
import { type CommandType } from "@wirestate/core";

import { type AnyObject, type Interface, type MaybePromise } from "../types/general";

import { OnCommandController } from "./on-command-controller";

/**
 * Describes type returned by {@link onCommand}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Commands
 */
export interface OnCommandDecorator<R = unknown, P = unknown, T extends CommandType = CommandType> {
  /**
   * Phantom field carrying the command type `T`.
   */
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
 * Decorator for Lit element methods that handle a specific command.
 *
 * @remarks
 * The handler is registered when the host connects, unregistered when it
 * disconnects, and re-registered when the nearest container context changes.
 * Command handlers are stack-based on the active command bus.
 *
 * @group Commands
 *
 * @param type - Command type to handle.
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
export function onCommand<R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T
): OnCommandDecorator<R, P, T> {
  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        new OnCommandController<R, P, T>(
          this as ReactiveElement,
          type,
          (payload: P) => (this as AnyObject)[nameOrContext.name](payload) as MaybePromise<R>
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnCommandController<R, P, T>(
          element,
          type,
          (payload: P) => (element as AnyObject)[nameOrContext](payload) as MaybePromise<R>
        );
      });
    }
  }) as OnCommandDecorator<R, P, T>;
}
