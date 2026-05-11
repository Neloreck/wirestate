import { ReactiveElement } from "@lit/reactive-element";
import { CommandType } from "@wirestate/core";

import { AnyObject, Interface, MaybePromise } from "../types/general";

import { OnCommandController } from "./on-command-controller";

/**
 * Represents interface for the {@link onCommand} decorator.
 *
 * Supports both standard (TC39) and legacy experimental decorators.
 *
 * @group Commands
 */
export interface OnCommandDecorator<D = unknown, R = unknown> {
  // Standard (TC39):
  <This extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: (this: This, data: D) => MaybePromise<R>,
    context: ClassMethodDecoratorContext<This>
  ): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Decorator that registers a Lit element method as a command handler for the given type.
 *
 * The handler is registered when the host element connects to the DOM and unregistered when it disconnects.
 *
 * @group Commands
 *
 * @param type - The command type to handle.
 * @returns The decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onCommand("SAVE")
 *   private handleSave(data: SomeData): void {
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
          (data: D) => (this as AnyObject)[nameOrContext.name](data) as MaybePromise<R>
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnCommandController<D, R>(
          element,
          type,
          (data: D) => (element as AnyObject)[nameOrContext](data) as MaybePromise<R>
        );
      });
    }
  }) as OnCommandDecorator<D, R>;
}
