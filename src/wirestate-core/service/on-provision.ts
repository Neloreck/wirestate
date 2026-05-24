import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { PROVISION_HANDLER_METADATA } from "../registry";
import { Maybe } from "../types/general";

/**
 * Decorator for service methods that should run when a framework provider exposes the service's container.
 *
 * @remarks
 * Provider adapters call `@OnProvision` when a container is attached to a UI
 * subtree, for example by React or Lit `ContainerProvider` and
 * `SubContainerProvider` implementations. Use it for setup tied to provider
 * presence rather than container/service activation.
 *
 * A service class may declare only one provision hook name. If a base class
 * declares one, subclasses may override and redecorate that same method name.
 *
 * @group Service
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class SomeService {
 *   @OnProvision()
 *   public onProvision(): void {
 *     // container is provided to a framework subtree
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
        ERROR_CODE_VALIDATION_ERROR,
        `Only one @OnProvision method can be declared on provider '${constructor.name}'.`
      );
    }

    PROVISION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnProvision} by traversing the prototype chain.
 *
 * @remarks
 * A service hierarchy may declare one provision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Service
 * @internal
 *
 * @param instance - The service instance to scan for provision handlers.
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
          ERROR_CODE_VALIDATION_ERROR,
          `Only one @OnProvision method can be declared across provider hierarchy '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`
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
