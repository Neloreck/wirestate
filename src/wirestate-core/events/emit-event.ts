import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { EventBus } from "@/wirestate-core/events/event-bus";
import { EVENT_BUS_TOKEN } from "@/wirestate-core/registry";
import type { TEventType } from "@/wirestate-core/types/events";

/**
 * Emits events for container from outside scope.
 *
 * @param container - inversify container
 * @param type - event type ot emit
 * @param payload - event payload
 * @param from - optional indicator of the event source
 */
export function emitEvent<P, T extends TEventType>(container: Container, type: T, payload?: P, from?: unknown): void {
  dbg.info(prefix(__filename), "Emit event:", { type: type, payload, container });

  container.get<EventBus>(EVENT_BUS_TOKEN).emit({ type, payload, from });
}
