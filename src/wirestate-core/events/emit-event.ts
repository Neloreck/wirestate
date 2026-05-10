import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { EventType } from "../types/events";

import { EventBus } from "./event-bus";

/**
 * Emits events for container from outside scope.
 *
 * @group events
 *
 * @param container - inversify container
 * @param type - event type ot emit
 * @param payload - event payload
 * @param from - optional indicator of the event source
 */
export function emitEvent<P, T extends EventType>(container: Container, type: T, payload?: P, from?: unknown): void {
  dbg.info(prefix(__filename), "Emit event:", { type: type, payload, container });

  container.get(EventBus).emit({ type, payload, from });
}
