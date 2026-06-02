import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { ACTIVATED_HANDLER_METADATA } from "../../registry";
import { Maybe } from "../../types/general";

/**
 * Runs an instance method after container activation.
 *
 * @remarks
 * Activation happens the first time the singleton instance is resolved.
 *
 * Use it for cheap resolution-time initialization that does not open resources.
 * Prefer `@OnProvision` for subscriptions, timers, sockets, observers, and
 * async work that needs cleanup. A class hierarchy may have one activation
 * hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnActivated } from "@wirestate/core";
 *
 * @Injectable()
 * class FeedService {
 *   @OnActivated()
 *   public onActivated(): void {
 *     this.initializeFromSeed();
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
        `Only one @OnActivated method can be declared on '${constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    ACTIVATED_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnActivated} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one activation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for activation handlers.
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
          `Only one @OnActivated method can be declared across class hierarchy for '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`,
          ERROR_CODE_VALIDATION_ERROR
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
