import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { DEACTIVATION_HANDLER_METADATA } from "../registry";

/**
 * Decorator for service methods that should be executed before the service instance is deactivated.
 *
 * @remarks
 * Methods decorated with `@OnDeactivation` are automatically invoked when the service
 * is being removed from the container or when the container itself is being disposed.
 *
 * It is commonly used for cleanup, unsubscribing from events, or stopping background tasks.
 * A service class may declare only one `@OnDeactivation` method. If a base class already
 * declares a deactivation hook, override that method without redecorating it.
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

    if (DEACTIVATION_HANDLER_METADATA.has(constructor)) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        `Only one @OnDeactivation method can be declared on service '${constructor.name}'.`
      );
    }

    DEACTIVATION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}
