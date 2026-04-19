import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { ISignalDispatchEntry, ISignalHandlerMetadata } from "@/wirestate/types/signals";

/**
 * Retrieves `@OnSignal` metadata from the class hierarchy.
 * Returns handlers ordered from base to derived class.
 *
 * @param instance - service instance
 * @returns metadata list
 * @internal
 */
export function getSignalHandlerMetadata(instance: object): ReadonlyArray<ISignalHandlerMetadata> {
  log.info(prefix(__filename), "Retrieving signal handler metadata:", { name: instance.constructor.name, instance });

  const chain: Array<Array<ISignalHandlerMetadata>> = [];
  let ctor: unknown = instance.constructor;

  // Traverse prototype chain up to Object/Function
  while (typeof ctor === "function" && ctor !== Object && ctor !== Function.prototype) {
    const own = SIGNAL_HANDLER_METADATA.get(ctor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    ctor = Object.getPrototypeOf(ctor);
  }

  log.info(prefix(__filename), "Retrieved signal handler metadata:", {
    name: instance.constructor.name,
    chain,
    instance,
  });

  // Reverse to ensure parent-first execution order
  return chain.reverse().flat();
}
