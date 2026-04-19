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
    const ctor = target.constructor;
    let list = QUERY_HANDLER_METADATA.get(ctor);

    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(ctor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
