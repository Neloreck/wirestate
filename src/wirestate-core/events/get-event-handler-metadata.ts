import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "../registry";
import { EventHandlerMetadata } from "../types/events";
import { Maybe } from "../types/general";

/**
 * Retrieves event handler metadata for a service instance by traversing its prototype chain.
 *
 * @remarks
 * This utility collects metadata registered via the {@link OnEvent} decorator.
 * It ensures that handlers are returned in parent-to-child order (base class handlers first),
 * which is critical for maintaining predictable event execution patterns in inherited services.
 *
 * @group Events
 * @internal
 *
 * @param instance - The service instance to scan for event handlers.
 * @returns A read-only array of event handler metadata, ordered from base to derived class.
 *
 * @example
 * ```typescript
 * const metadata = getEventHandlerMetadata(myService);
 *
 * metadata.forEach(meta => {
 *   console.log(`Method ${String(meta.propertyKey)} handles event ${String(meta.type)}`);
 * });
 * ```
 */
export function getEventHandlerMetadata(instance: object): ReadonlyArray<EventHandlerMetadata> {
  dbg.info(prefix(__filename), "Retrieving event handler metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  const chain: Array<Array<EventHandlerMetadata>> = [];

  // Traverse prototype chain up to Object/Function
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<Array<EventHandlerMetadata>> = EVENT_HANDLER_METADATA.get(constructor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Retrieved event handler metadata:", {
    name: instance.constructor.name,
    chain,
    instance,
  });

  // Reverse to ensure parent-first execution order
  return chain.reverse().flat();
}
