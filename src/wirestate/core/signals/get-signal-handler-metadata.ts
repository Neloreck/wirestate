import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_HANDLER_METADATA } from "@/wirestate/core/registry";
import { Maybe } from "@/wirestate/types/general";
import type { ISignalHandlerMetadata } from "@/wirestate/types/signals";

/**
 * Retrieves `@OnSignal` metadata from the class hierarchy.
 * Returns handlers ordered from base to derived class.
 *
 * @param instance - service instance
 * @returns metadata list
 * @internal
 */
export function getSignalHandlerMetadata(instance: object): ReadonlyArray<ISignalHandlerMetadata> {
  dbg.info(prefix(__filename), "Retrieving signal handler metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  const chain: Array<Array<ISignalHandlerMetadata>> = [];

  // Traverse prototype chain up to Object/Function
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<Array<ISignalHandlerMetadata>> = SIGNAL_HANDLER_METADATA.get(constructor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Retrieved signal handler metadata:", {
    name: instance.constructor.name,
    chain,
    instance,
  });

  // Reverse to ensure parent-first execution order
  return chain.reverse().flat();
}
