import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ACTIVATED_HANDLER_METADATA } from "../registry";
import { Maybe } from "../types/general";

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

/**
 * Retrieves the method decorated with {@link OnActivated} by traversing the prototype chain.
 *
 * @remarks
 * A service hierarchy may declare one activation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Service
 * @internal
 *
 * @param instance - The service instance to scan for activation handlers.
 * @returns The method name (string or symbol), or `null` when no hook exists.
 *
 * @example
 * ```typescript
 * const method = getActivatedHandlerMetadata(myService);
 * method && (myService as any)[method]();
 * ```
 */
export function getActivatedHandlerMetadata(instance: object): Maybe<string | symbol> {
  dbg.info(prefix(__filename), "Resolving OnActivated metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;

  let handler: Maybe<string | symbol> = null;
  let ownerName: Maybe<string> = null;

  // Traverse prototype chain up to Object/Function.
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<string | symbol> = ACTIVATED_HANDLER_METADATA.get(constructor as object) ?? null;

    if (own) {
      if (handler && handler !== own) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `Only one @OnActivated method can be declared across service hierarchy '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`
        );
      }

      handler = own;
      ownerName = constructor.name;
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Resolved OnActivated metadata:", {
    name: instance.constructor.name,
    handler,
    ownerName,
    instance,
  });

  return handler;
}
