import { type ContainerKernel } from "../../container/container-kernel";
import { type Nullable } from "../../types/general";
import { type MessagingHandlerDecorator, createMessagingDecorator } from "../messaging-decorator";
import { type MessagingRegistration } from "../messaging-registration";

import { buildEventDispatchers } from "./build-event-dispatchers";
import { EventBus } from "./event-bus";
import { type EventHandlerMetadata, type EventType } from "./events";
import { EVENT_HANDLER_METADATA, EVENT_METADATA_KEY } from "./events-registry";

/**
 * Wires an instance's `@OnEvent` methods onto the {@link EventBus}.
 *
 * @remarks
 * Declared beside the events code so importing `@OnEvent` (or {@link EventsPlugin})
 * is what pulls {@link EventBus} into the bundle. The dispatcher stays bus-agnostic.
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
export type OnEventDecorator = MessagingHandlerDecorator;

const decorate = createMessagingDecorator<EventHandlerMetadata>({
  name: "OnEvent",
  registry: EVENT_HANDLER_METADATA,
  metadataKey: EVENT_METADATA_KEY,
  registration: EVENT_REGISTRATION,
});

/**
 * Marks an injectable service method as a provision-scoped event handler.
 *
 * @remarks
 * The handler is registered when the owning container is provisioned and
 * unregistered when that provision cycle ends. Register {@link EventsPlugin}
 * on the container, or on an ancestor container, to enable event handlers.
 *
 * Omit `types` to receive every event emitted on the active event bus. Repeated
 * types are deduplicated for one decorated method.
 *
 * @group Events
 *
 * @param types - Event token or tokens. Omit for all events.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnEvent, type WireEvent } from "@wirestate/core";
 *
 * interface User {
 *   id: string;
 * }
 *
 * @Injectable()
 * class MyService {
 *   @OnEvent("USER_LOGGED_IN")
 *   private onLogin(event: WireEvent<User>): void {
 *     console.log(event.payload?.id);
 *   }
 * }
 * ```
 */
export function OnEvent(types?: EventType | ReadonlyArray<EventType>): OnEventDecorator {
  // Normalize types to a deduplicated array, or null for catch-all.
  const normalized: Nullable<ReadonlyArray<EventType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? Array.from(new Set(types as ReadonlyArray<EventType>))
        : [types as EventType];

  return decorate((methodName: string | symbol): EventHandlerMetadata => ({ methodName, types: normalized }));
}
