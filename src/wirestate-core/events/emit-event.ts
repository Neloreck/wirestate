import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { EventType } from "../types/events";

import { EventBus } from "./event-bus";

/**
 * Broadcasts an event to all subscribers via the {@link EventBus} resolved from the container.
 *
 * @remarks
 * Use this utility to emit events from outside a service's {@link WireScope} (e.g., from a bootstrap script or external controller).
 *
 * @group Events
 *
 * @template P - Type of the event payload.
 * @template T - Type of the event identifier.
 *
 * @param container - Inversify {@link Container} to resolve the {@link EventBus} from.
 * @param type - Unique event identifier.
 * @param payload - Optional data associated with the event.
 * @param from - Optional source identifier.
 *
 * @example
 * ```typescript
 * emitEvent(container, "SYSTEM_READY", { version: "1.0.0" });
 * ```
 */
export function emitEvent<P, T extends EventType>(container: Container, type: T, payload?: P, from?: unknown): void {
  dbg.info(prefix(__filename), "Emit event:", { type: type, payload, container });

  container.get(EventBus).emit({ type, payload, from });
}
