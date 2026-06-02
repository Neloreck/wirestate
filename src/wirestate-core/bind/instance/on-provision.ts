import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { PROVISION_HANDLER_METADATA } from "../../registry";
import { Maybe } from "../../types/general";

/**
 * Runs when a framework provider exposes the container.
 *
 * @remarks
 * React and Lit providers call this when a container enters a UI subtree.
 * This is provider lifetime, not instance lifetime.
 *
 * Use it for subscriptions, timers, sockets, observers, provider-scoped async
 * work, or any resource that should be cleaned up when the provider releases
 * the container. A class hierarchy may have one provision hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnProvision } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnProvision()
 *   public onProvision(): void {
 *     this.startPolling();
 *     this.connect();
 *   }
 * }
 * ```
 */
export function OnProvision(): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnProvision metadata:", {
      name: (target as object).constructor.name,
      propertyKey,
      target,
      constructor: (target as object).constructor,
    });

    const constructor = (target as object).constructor;

    if (PROVISION_HANDLER_METADATA.has(constructor)) {
      throw new WirestateError(
        `Only one @OnProvision method can be declared on provider '${constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    PROVISION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnProvision} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one provision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for provision handlers.
 * @returns The method name, or `null` when no hook exists.
 */
export function getProvisionHandlerMetadata(instance: object): Maybe<string | symbol> {
  dbg.info(prefix(__filename), "Resolving OnProvision metadata:", { name: instance.constructor.name, instance });

  let constructor: unknown = instance.constructor;
  let handler: Maybe<string | symbol> = null;
  let ownerName: Maybe<string> = null;

  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<string | symbol> = PROVISION_HANDLER_METADATA.get(constructor as object) ?? null;

    if (own) {
      if (handler && handler !== own) {
        throw new WirestateError(
          `Only one @OnProvision method can be declared across provider hierarchy '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`,
          ERROR_CODE_VALIDATION_ERROR
        );
      }

      handler = own;
      ownerName = constructor.name;
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  dbg.info(prefix(__filename), "Resolved OnProvision metadata:", {
    name: instance.constructor.name,
    handler,
    ownerName,
    instance,
  });

  return handler;
}
