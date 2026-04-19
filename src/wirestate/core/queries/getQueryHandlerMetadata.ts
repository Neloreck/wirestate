import { QUERY_HANDLER_METADATA } from "../registry";
import type { IQueryHandlerMetadata } from "../types/queries";

/**
 * Retrieves `@OnQuery` metadata from the class hierarchy.
 * Returns handlers ordered from base to derived class.
 *
 * @internal
 * @param instance - service instance
 */
export function getQueryHandlerMetadata(instance: object): ReadonlyArray<IQueryHandlerMetadata> {
  const chain: Array<Array<IQueryHandlerMetadata>> = [];
  let ctor: unknown = instance.constructor;

  // Traverse prototype chain up to Object/Function
  while (typeof ctor === "function" && ctor !== Object && ctor !== Function.prototype) {
    const own = QUERY_HANDLER_METADATA.get(ctor as object);

    if (own && own.length > 0) {
      chain.push(own);
    }

    ctor = Object.getPrototypeOf(ctor);
  }

  // Reverse to ensure parent-first execution order
  return chain.reverse().flat();
}
