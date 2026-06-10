import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { collectHandlerMetadata } from "../metadata/handler-metadata";
import { EVENT_HANDLER_METADATA, EVENT_METADATA_KEY } from "../registry";
import { EventHandlerMetadata } from "../types/events";

/**
 * Retrieves event handler metadata for an instance by traversing its prototype chain.
 *
 * @remarks
 * This utility collects metadata registered via the {@link OnEvent} decorator.
 * It ensures that handlers are returned in parent-to-child order (base class handlers first),
 * which is critical for maintaining predictable event execution patterns in inherited services.
 *
 * @group Events
 * @internal
 *
 * @param instance - The instance to scan for event handlers.
 * @returns A read-only array of event handler metadata, ordered from base to derived class.
 *
 * @example
 * ```typescript
 * const metadata = getEventHandlerMetadata(myService);
 *
 * metadata.forEach(meta => {
 *   console.log(`Method ${String(meta.methodName)} handles events ${String(meta.types)}`);
 * });
 * ```
 */
export function getEventHandlerMetadata(instance: object): ReadonlyArray<EventHandlerMetadata> {
  dbg.info(prefix(__filename), "Retrieving event handler metadata:", { name: instance.constructor.name, instance });

  return collectHandlerMetadata(instance, EVENT_HANDLER_METADATA, EVENT_METADATA_KEY);
}
