import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { DEACTIVATION_HANDLER_METADATA } from "../registry";
import { Maybe } from "../types/general";

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

/**
 * Retrieves the method decorated with {@link OnDeactivation} by traversing the prototype chain.
 *
 * @remarks
 * A service hierarchy may declare one deactivation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Service
 * @internal
 *
 * @param instance - The service instance to scan for deactivation handlers.
 * @returns The method name (string or symbol), or `null` when no hook exists.
 *
 * @example
 * ```typescript
 * const method = getDeactivationHandlerMetadata(myService);
 * method && (myService as any)[method]();
 * ```
 */
export function getDeactivationHandlerMetadata(instance: object): Maybe<string | symbol> {
  dbg.info(prefix(__filename), "Resolving OnDeactivation metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  let handler: Maybe<string | symbol> = null;
  let ownerName: Maybe<string> = null;

  // Traverse prototype chain up to Object/Function.
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<string | symbol> = DEACTIVATION_HANDLER_METADATA.get(constructor as object) ?? null;

    if (own) {
      if (handler && handler !== own) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `Only one @OnDeactivation method can be declared across service hierarchy '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`
        );
      }

      handler = own;
      ownerName = constructor.name;
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Resolved OnDeactivation metadata:", {
    name: instance.constructor.name,
    handler,
    ownerName,
    instance,
  });

  return handler;
}
