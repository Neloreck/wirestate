import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { COMMAND_HANDLER_METADATA } from "@/wirestate-core/registry";
import type { CommandHandlerMetadata, CommandType } from "@/wirestate-core/types/commands";
import type { Maybe } from "@/wirestate-core/types/general";

/**
 * Decorator for service methods that handle a command.
 *
 * @param type - command type identifier
 * @returns decorator function
 */
export function OnCommand(type: CommandType): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnCommand metadata:", {
      name: target.constructor.name,
      type,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<CommandHandlerMetadata>> = COMMAND_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      COMMAND_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
