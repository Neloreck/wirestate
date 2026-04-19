import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { IQueryHandlerMetadata } from "@/wirestate/types/queries";

/**
 * Retrieves `@OnQuery` metadata from the class hierarchy.
 * Returns handlers ordered from base to derived class.
 *
 * @param instance - service instance
 * @returns metadata list
 * @internal
 */
export function getQueryHandlerMetadata(instance: object): ReadonlyArray<IQueryHandlerMetadata> {
  dbg.info(prefix(__filename), "Resolving instance query metadata:", { name: instance.constructor.name, instance });

  const chain: Array<Array<IQueryHandlerMetadata>> = [];
  let constructor: unknown = instance.constructor;

  // Traverse prototype chain up to Object/Function
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = QUERY_HANDLER_METADATA.get(constructor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Resolved instance query metadata:", {
    name: instance.constructor.name,
    instance,
    chain,
  });

  // Reverse to ensure parent-first execution order.
  return chain.reverse().flat();
}
