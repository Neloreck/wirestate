import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { IEventHandlerMetadata } from "@/wirestate/types/events";
import { Maybe } from "@/wirestate/types/general";

/**
 * Retrieves `@OnEvent` metadata from the class hierarchy.
 * Returns handlers ordered from base to derived class.
 *
 * @param instance - service instance
 * @returns metadata list
 * @internal
 */
export function getEventHandlerMetadata(instance: object): ReadonlyArray<IEventHandlerMetadata> {
  dbg.info(prefix(__filename), "Retrieving event handler metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  const chain: Array<Array<IEventHandlerMetadata>> = [];

  // Traverse prototype chain up to Object/Function
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<Array<IEventHandlerMetadata>> = EVENT_HANDLER_METADATA.get(constructor as object);

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
