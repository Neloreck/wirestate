import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "../registry";
import { Maybe } from "../types/general";
import { QueryHandlerMetadata } from "../types/queries";

/**
 * Retrieves query handler metadata for a service instance by traversing its prototype chain.
 *
 * @remarks
 * This utility collects metadata registered via the {@link OnQuery} decorator.
 * It ensures that handlers are returned in parent-to-child order (base class handlers first).
 * Since queries support shadowing, child class handlers registered later will effectively
 * override parent handlers for the same query type.
 *
 * @group Queries
 * @internal
 *
 * @param instance - The service instance to scan for query handlers.
 * @returns A read-only array of query handler metadata, ordered from base to derived class.
 *
 * @example
 * ```typescript
 * const metadata = getQueryHandlerMetadata(myService);
 *
 * metadata.forEach(meta => {
 *   console.log(`Method ${String(meta.methodName)} handles query ${String(meta.type)}`);
 * });
 * ```
 */
export function getQueryHandlerMetadata(instance: object): ReadonlyArray<QueryHandlerMetadata> {
  dbg.info(prefix(__filename), "Resolving instance query metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  const chain: Array<Array<QueryHandlerMetadata>> = [];

  // Traverse prototype chain up to Object/Function
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<Array<QueryHandlerMetadata>> = QUERY_HANDLER_METADATA.get(constructor as object);

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
