import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { COMMAND_HANDLER_METADATA } from "../registry";
import type { CommandHandlerMetadata, CommandType } from "../types/commands";
import type { Maybe } from "../types/general";

/**
 * Decorator for service methods that handle a specific command.
 *
 * @remarks
 * Methods decorated with `@OnCommand` are automatically registered as command handlers
 * when the service is bound via {@link bindService}.
 *
 * @group commands
 *
 * @param type - Unique identifier of the command to handle.
 * @returns A method decorator function.
 *
 * @example
 * ```typescript
 * class UserService {
 *   @OnCommand("USER_LOGIN")
 *   private onUserLogin(credentials: Credentials): Promise<Session> {
 *     return auth.login(credentials);
 *   }
 * }
 * ```
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
