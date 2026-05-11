import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ACTIVATED_HANDLER_METADATA } from "../registry";
import type { Maybe } from "../types/general";

/**
 * Decorator for service methods that should be executed after the service instance is activated.
 *
 * @remarks
 * Methods decorated with `@OnActivated` are automatically invoked when the service
 * is resolved from the container and its activation lifecycle hook is triggered.
 *
 * It is commonly used for initial setup, subscribing to events, or starting background tasks.
 * Multiple `@OnActivated` methods can exist in the same class hierarchy; they are executed
 * in parent-to-child order.
 *
 * @group Service
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnActivated()
 *   public onActivated(): void {
 *     console.log("Service activated!");
 *   }
 * }
 * ```
 */
export function OnActivated(): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnActivated metadata:", {
      name: (target as object).constructor.name,
      propertyKey,
      target,
      constructor: (target as object).constructor,
    });

    const constructor = (target as object).constructor;

    let list: Maybe<Array<string | symbol>> = ACTIVATED_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      ACTIVATED_HANDLER_METADATA.set(constructor, list);
    }

    list.push(propertyKey);
  };
}
