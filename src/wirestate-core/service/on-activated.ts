import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ACTIVATED_HANDLER_METADATA } from "../registry";

/**
 * Decorator for service methods that should be executed after the service instance is activated.
 *
 * @remarks
 * Methods decorated with `@OnActivated` are automatically invoked when the service
 * is resolved from the container and its activation lifecycle hook is triggered.
 *
 * It is commonly used for initial setup, subscribing to events, or starting background tasks.
 * A service class may declare only one `@OnActivated` method. If a base class already
 * declares an activation hook, override that method without redecorating it.
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

    if (ACTIVATED_HANDLER_METADATA.has(constructor)) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        `Only one @OnActivated method can be declared on service '${constructor.name}'.`
      );
    }

    ACTIVATED_HANDLER_METADATA.set(constructor, propertyKey);
  };
}
