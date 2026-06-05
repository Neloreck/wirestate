import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { getPrototypeChainMetadata } from "../../metadata/prototype-chain";
import { DEPROVISION_HANDLER_METADATA } from "../../registry";
import { Maybe } from "../../types/general";

/**
 * Runs before a framework provider stops exposing the container.
 *
 * @remarks
 * React and Lit providers call this when a container leaves a UI subtree.
 * This is provider lifetime, not instance lifetime.
 *
 * Use it to clean up work started by `@OnProvision`. A class hierarchy may
 * have one deprovision hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeprovision } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnDeprovision()
 *   public onDeprovision(): void {
 *     this.stopPolling();
 *     this.disconnect();
 *   }
 * }
 * ```
 */
export function OnDeprovision(): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnDeprovision metadata:", {
      name: (target as object).constructor.name,
      propertyKey,
      target,
      constructor: (target as object).constructor,
    });

    const constructor = (target as object).constructor;

    if (DEPROVISION_HANDLER_METADATA.has(constructor)) {
      throw new WirestateError(
        `Only one @OnDeprovision method can be declared on provider '${constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    DEPROVISION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnDeprovision} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one deprovision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for deprovision handlers.
 * @returns The method name, or `null` when no hook exists.
 */
export function getDeprovisionHandlerMetadata(instance: object): Maybe<string | symbol> {
  dbg.info(prefix(__filename), "Resolving OnDeprovision metadata:", { name: instance.constructor.name, instance });

  let handler: Maybe<string | symbol> = null;

  for (const metadata of getPrototypeChainMetadata(instance, DEPROVISION_HANDLER_METADATA)) {
    if (handler && handler !== metadata) {
      throw new WirestateError(
        `Only one @OnDeprovision method can be declared across provider hierarchy '${instance.constructor.name}'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }

    handler = metadata;
  }

  return handler;
}
