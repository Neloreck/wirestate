import { QUERY_HANDLER_METADATA } from "../registry";
import type { TQueryType } from "../types/queries";

/**
 * Decorator for service methods that respond to a query.
 *
 * @param type - query type identifier
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
