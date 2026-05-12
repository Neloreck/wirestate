import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventType } from "@wirestate/core";

import { AnyObject, Interface, Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * Represents type definition for the on-event decorator.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Events
 */
export interface OnEventDecorator<E extends Event = Event> {
  // Standard (TC39):
  <This extends Interface<Omit<ReactiveElement, "renderRoot">>>(
    value: (this: This, event: E) => void,
    context: ClassMethodDecoratorContext<This>
  ): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Decorator for Lit element methods that handle events from the event bus.
 *
 * @remarks
 * The handler is registered when the host connects and unregistered when it disconnects.
 *
 * @group Events
 *
 * @param types - Event types to listen for. If omitted, all events will be handled.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onEvent()
 *   private onMyEvent(event: Event) {
 *     console.log("Event received:", event);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onEvent("MY_EVENT_TYPE")
 *   private onMyEvent(event: MyEvent) {
 *     console.log("Event received:", event);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   @onEvent(["MY_EVENT_TYPE_1", "MY_EVENT_TYPE_2"])
 *   private onMyEvent(event: Event) {
 *     console.log("Event received:", event);
 *   }
 * }
 * ```
 */
export function onEvent<E extends Event = Event>(types?: EventType | ReadonlyArray<EventType>): OnEventDecorator<E> {
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function (): void {
        new OnEventController(this as ReactiveElement, normalized, (event) =>
          (this as AnyObject)[nameOrContext.name](event)
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement): void => {
        new OnEventController(element, normalized, (event) => (element as AnyObject)[nameOrContext](event));
      });
    }
  }) as OnEventDecorator<E>;
}
