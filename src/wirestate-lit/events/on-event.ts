import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventType } from "@wirestate/core";

import { AnyObject, Interface, Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * @group events
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
 * @group events
 *
 * @param types
 */
export function onEvent<E extends Event = Event>(types?: EventType | ReadonlyArray<EventType>): OnEventDecorator<E> {
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return ((protoOrTarget: object, nameOrContext: PropertyKey | ClassMethodDecoratorContext) => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      nameOrContext.addInitializer(function () {
        new OnEventController(this as ReactiveElement, normalized, (event) =>
          (this as AnyObject)[nameOrContext.name](event)
        );
      });
    } else {
      // Experimental legacy decorators:
      (protoOrTarget.constructor as typeof ReactiveElement).addInitializer((element: ReactiveElement) => {
        new OnEventController(element, normalized, (event) => (element as AnyObject)[nameOrContext](event));
      });
    }
  }) as OnEventDecorator<E>;
}
