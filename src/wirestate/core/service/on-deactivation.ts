import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_NOT_ABSTRACT_SERVICE } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { DEACTIVATION_HANDLER_METADATA } from "@/wirestate/core/registry";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import type { Maybe } from "@/wirestate/types/general";

/**
 * Decorator for service methods that run before deactivation.
 * Only valid on `AbstractService` subclasses.
 *
 * @returns decorator function
 */
export function OnDeactivation(): MethodDecorator {
  return (target, propertyKey) => {
    if (!Object.prototype.isPrototypeOf.call(AbstractService.prototype, target)) {
      throw new WirestateError(
        ERROR_CODE_NOT_ABSTRACT_SERVICE,
        "@OnDeactivation: can only be applied to methods of AbstractService subclasses. " +
          `'${String(propertyKey)}' was applied to an incompatible class.`
      );
    }

    dbg.info(prefix(__filename), "Attaching OnDeactivation metadata:", {
      name: (target as object).constructor.name,
      propertyKey,
      target,
      constructor: (target as object).constructor,
    });

    const constructor = (target as object).constructor;

    let list: Maybe<Array<string | symbol>> = DEACTIVATION_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      DEACTIVATION_HANDLER_METADATA.set(constructor, list);
    }

    list.push(propertyKey);
  };
}
