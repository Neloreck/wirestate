import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ACTIVATED_HANDLER_METADATA } from "../registry";
import type { Maybe } from "../types/general";

/**
 * Decorator for service methods that run after activation.
 *
 * @group service
 *
 * @returns Decorator function.
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

    let list: Maybe<Array<string | symbol>> = ACTIVATED_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      ACTIVATED_HANDLER_METADATA.set(constructor, list);
    }

    list.push(propertyKey);
  };
}
