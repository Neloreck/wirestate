import { WirestateError } from "@wirestate/core";

import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { Maybe } from "../types/general";

const DEPROVISION_HANDLER_METADATA: WeakMap<object, string | symbol> = new WeakMap();

/**
 * Decorator for methods that should run when a React provider is deprovisioned.
 *
 * @remarks
 * The decorator only records the method name. Provider code retrieves that
 * metadata internally and invokes the method when the committed provider is
 * replaced or removed.
 *
 * A class may declare only one deprovision hook name. If a base class declares
 * one, subclasses may override and redecorate that same method name.
 *
 * @group Provision
 *
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class SomeService {
 *   @OnDeprovision()
 *   public onDeprovision(): void {
 *     // provider removed
 *   }
 * }
 * ```
 */
export function OnDeprovision(): MethodDecorator {
  return (target, propertyKey) => {
    const constructor = (target as object).constructor;

    if (DEPROVISION_HANDLER_METADATA.has(constructor)) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        `Only one @OnDeprovision method can be declared on provider '${constructor.name}'.`
      );
    }

    DEPROVISION_HANDLER_METADATA.set(constructor, propertyKey);
  };
}

/**
 * Retrieves the method decorated with {@link OnDeprovision} by traversing the prototype chain.
 *
 * @remarks
 * A provider hierarchy may declare one deprovision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Provision
 * @internal
 *
 * @param instance - The provider instance to scan for deprovision handlers.
 * @returns The method name, or `null` when no hook exists.
 */
export function getDeprovisionHandlerMetadata(instance: object): Maybe<string | symbol> {
  let constructor: unknown = instance.constructor;
  let handler: Maybe<string | symbol> = null;
  let ownerName: Maybe<string> = null;

  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Maybe<string | symbol> = DEPROVISION_HANDLER_METADATA.get(constructor as object) ?? null;

    if (own) {
      if (handler && handler !== own) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `Only one @OnDeprovision method can be declared across provider hierarchy '${instance.constructor.name}'. ` +
            `Found '${String(handler)}' on '${ownerName ?? "unknown"}' and '${String(own)}' on '${constructor.name}'.`
        );
      }

      handler = own;
      ownerName = constructor.name;
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  return handler;
}
