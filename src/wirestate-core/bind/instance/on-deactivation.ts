import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { getPrototypeChainMetadata } from "../../metadata/prototype-chain";
import { DEACTIVATION_HANDLER_METADATA } from "../../registry";
import { Maybe } from "../../types/general";

/**
 * Runs an instance method during container deactivation.
 *
 * @remarks
 * Deactivation happens when the container unbinds or disposes the instance.
 *
 * Use it for container-disposal cleanup. Prefer `@OnDeprovision` for work
 * started by provider ownership, such as subscriptions, timers, sockets, and
 * observers. A class hierarchy may have one deactivation hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeactivation } from "@wirestate/core";
 *
 * @Injectable()
 * class FeedService {
 *   @OnDeactivation()
 *   public onDeactivation(): void {
 *     this.disposeResources();
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
        `Only one @OnDeactivation method can be declared on '${constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    DEACTIVATION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnDeactivation} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one deactivation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for deactivation handlers.
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

  let handler: Maybe<string | symbol> = null;

  for (const metadata of getPrototypeChainMetadata(instance, DEACTIVATION_HANDLER_METADATA)) {
    if (handler && handler !== metadata) {
      throw new WirestateError(
        `Only one @OnDeactivation method can be declared across class hierarchy for '${instance.constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    handler = metadata;
  }

  return handler;
}
