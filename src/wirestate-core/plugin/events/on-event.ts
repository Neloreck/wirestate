import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { ContainerKernel } from "../../container/container-kernel";
import { validateStandardMethodContext } from "../../metadata/metadata-decorator-context";
import { appendHandlerMetadata, appendStandardHandlerMetadata } from "../../metadata/metadata-handlers";
import type { Optional } from "../../types/general";
import {
  MESSAGING_REGISTRATION_KEY,
  MESSAGING_REGISTRATIONS,
  type MessagingRegistration,
} from "../messaging-registration";

import { buildEventDispatchers } from "./build-event-dispatchers";
import { EventBus } from "./event-bus";
import type { EventType } from "./events";
import { EVENT_HANDLER_METADATA, EVENT_METADATA_KEY } from "./events-registry";

/**
 * Wires an instance's `@OnEvent` methods onto the {@link EventBus}.
 *
 * @remarks
 * Declared beside the events code so importing `@OnEvent` (or {@link EventsPlugin})
 * is what pulls {@link EventBus} into the bundle; the dispatcher stays bus-agnostic.
 *
 * @internal
 */
export const EVENT_REGISTRATION: MessagingRegistration = {
  kind: Symbol("@wirestate/core/messaging/event"),
  token: EventBus,
  register: (bus: object, instance: object, container: ContainerKernel): Array<() => void> => {
    const eventBus: EventBus = bus as EventBus;

    return buildEventDispatchers(instance, container).map((dispatch) =>
      eventBus.subscribe(dispatch.types, dispatch.handler)
    );
  },
};

/**
 * Describes the decorator returned by {@link OnEvent}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Events
 */
export interface OnEventHandlerDecorator {
  // Standard (TC39). Parameters are `never[]`: contravariance keeps handlers with
  // narrowed event payloads assignable, matching {@link OnCommand} and {@link OnQuery}.
  <This>(value: (this: This, ...args: Array<never>) => unknown, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Marks a method as an event handler.
 *
 * @remarks
 * The handler registers when the instance activates and unregisters when the
 * instance deactivates.
 *
 * Omit `types` to receive every event in the container.
 *
 * @group Events
 *
 * @template E - Event type received by the decorated method.
 *
 * @param types - Event token or tokens. Omit for all events.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnEvent, WireEvent } from "@wirestate/core";
 *
 * @Injectable()
 * class MyService {
 *   @OnEvent("USER_LOGGED_IN")
 *   private onLogin(event: WireEvent<User>): void {
 *     console.log(event.payload.id);
 *   }
 * }
 * ```
 */
export function OnEvent(types?: EventType | ReadonlyArray<EventType>): OnEventHandlerDecorator {
  // Normalize types to a deduplicated array, or null for catch-all.
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? Array.from(new Set(types as ReadonlyArray<EventType>))
        : [types as EventType];

  return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      const metadata: DecoratorMetadataObject = validateStandardMethodContext("OnEvent", nameOrContext);

      dbg.info(prefix(__filename), "Attaching OnEvent metadata (TC39):", {
        types,
        propertyKey: nameOrContext.name,
        context: nameOrContext,
      });

      appendStandardHandlerMetadata(metadata, EVENT_METADATA_KEY, {
        methodName: nameOrContext.name,
        types: normalized,
      });
      appendStandardHandlerMetadata(metadata, MESSAGING_REGISTRATION_KEY, EVENT_REGISTRATION);
    } else {
      // Experimental legacy decorators:
      dbg.info(prefix(__filename), "Attaching OnEvent metadata:", {
        name: target.constructor.name,
        types,
        propertyKey: nameOrContext,
        target,
        constructor: target.constructor,
      });

      appendHandlerMetadata(EVENT_HANDLER_METADATA, target.constructor, {
        methodName: nameOrContext,
        types: normalized,
      });
      appendHandlerMetadata(MESSAGING_REGISTRATIONS, target.constructor, EVENT_REGISTRATION);
    }
  }) as OnEventHandlerDecorator;
}
