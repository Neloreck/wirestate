import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { TQueryType } from "@/wirestate/types/queries";

/**
 * Decorator for service methods that respond to a query.
 *
 * @param type - query type identifier
 * @returns decorator function
 */
export function OnQuery(type: TQueryType): MethodDecorator {
  return (target, propertyKey) => {
    log.info(prefix(__filename), "Attaching OnQuery metadata:", {
      name: target.constructor.name,
      type,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;
    let list = QUERY_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
