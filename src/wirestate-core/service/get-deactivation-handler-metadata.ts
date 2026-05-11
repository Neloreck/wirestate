import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { DEACTIVATION_HANDLER_METADATA } from "../registry";
import type { Maybe } from "../types/general";

/**
 * Retrieves the names of methods decorated with {@link OnDeactivation} by traversing the prototype chain.
 *
 * @remarks
 * This utility ensures that handlers are returned in parent-to-child order (base class handlers first),
 * maintaining a predictable cleanup sequence for inherited services.
 *
 * @group Service
 * @internal
 *
 * @param instance - The service instance to scan for deactivation handlers.
 * @returns A read-only array of method names (strings or symbols).
 *
 * @example
 * ```typescript
 * const methods = getDeactivationHandlerMetadata(myService);
 *
 * methods.forEach(methodName => (myService as any)[methodName]());
 * ```
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
