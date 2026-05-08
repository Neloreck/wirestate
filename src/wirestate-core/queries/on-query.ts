import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "@/wirestate-core/registry";
import type { Maybe } from "@/wirestate-core/types/general";
import type { QueryHandlerMetadata, QueryType } from "@/wirestate-core/types/queries";

/**
 * Decorator for service methods that respond to a query.
 *
 * @param type - query type identifier
 * @returns decorator function
 */
export function OnQuery(type: QueryType): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnQuery metadata:", {
      name: target.constructor.name,
      type,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<QueryHandlerMetadata>> = QUERY_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
