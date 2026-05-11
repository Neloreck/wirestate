import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { DEACTIVATION_HANDLER_METADATA } from "../registry";
import type { Maybe } from "../types/general";

/**
 * Decorator for service methods that should be executed before the service instance is deactivated.
 *
 * @remarks
 * Methods decorated with `@OnDeactivation` are automatically invoked when the service
 * is being removed from the container or when the container itself is being disposed.
 *
 * It is commonly used for cleanup, unsubscribing from events, or stopping background tasks.
 * Multiple `@OnDeactivation` methods can exist in the same class hierarchy; they are executed
 * in parent-to-child order.
 *
 * @group Service
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnDeactivation()
 *   public onDeactivation(): void {
 *     console.log("Service deactivating!");
 *   }
 * }
 * ```
 */
export function OnDeactivation(): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnDeactivation metadata:", {
      name: (target as object).constructor.name,
      propertyKey,
      target,
      constructor: (target as object).constructor,
    });

    const constructor = (target as object).constructor;

    let list: Maybe<Array<string | symbol>> = DEACTIVATION_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      DEACTIVATION_HANDLER_METADATA.set(constructor, list);
    }

    list.push(propertyKey);
  };
}
