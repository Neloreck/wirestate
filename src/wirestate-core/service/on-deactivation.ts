import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { DEACTIVATION_HANDLER_METADATA } from "@/wirestate-core/registry";
import type { Maybe } from "@/wirestate-core/types/general";

/**
 * Decorator for service methods that run before deactivation.
 *
 * @returns decorator function
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

    let list: Maybe<Array<string | symbol>> = DEACTIVATION_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      DEACTIVATION_HANDLER_METADATA.set(constructor, list);
    }

    list.push(propertyKey);
  };
}
