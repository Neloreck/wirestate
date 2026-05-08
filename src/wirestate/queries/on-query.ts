import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "@/wirestate/registry";
import type { Maybe } from "@/wirestate/types/general";
import type { IQueryHandlerMetadata, TQueryType } from "@/wirestate/types/queries";

/**
 * Decorator for service methods that respond to a query.
 *
 * @param type - query type identifier
 * @returns decorator function
 */
export function OnQuery(type: TQueryType): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnQuery metadata:", {
      name: target.constructor.name,
      type,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<IQueryHandlerMetadata>> = QUERY_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
