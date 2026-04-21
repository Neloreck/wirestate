import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { DEACTIVATION_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { Maybe } from "@/wirestate/types/general";

/**
 * Retrieves `@OnDeactivation` method names from the class hierarchy.
 * Returns method names ordered from base to derived class.
 *
 * @param instance - service instance
 * @returns list of method names
 * @internal
 */
export function getDeactivationHandlerMetadata(instance: object): ReadonlyArray<string | symbol> {
  dbg.info(prefix(__filename), "Resolving OnDeactivation metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  const chain: Array<Array<string | symbol>> = [];

  // Traverse prototype chain up to Object/Function.
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<Array<string | symbol>> = DEACTIVATION_HANDLER_METADATA.get(constructor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Resolved OnDeactivation metadata:", {
    name: instance.constructor.name,
    chain,
    instance,
  });

  // Reverse to ensure parent-first execution order.
  return chain.reverse().flat();
}
