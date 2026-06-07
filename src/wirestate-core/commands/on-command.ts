import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { appendHandlerMetadata } from "../metadata/handler-metadata";
import { COMMAND_HANDLER_METADATA } from "../registry";
import { CommandType } from "../types/commands";

/**
 * Marks a method as a command handler.
 *
 * @remarks
 * The handler registers when the instance activates and unregisters when the
 * instance deactivates. One command call goes to one handler: the newest
 * registered handler for that token.
 *
 * @group Commands
 *
 * @param type - Command token.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnCommand } from "@wirestate/core";
 *
 * @Injectable()
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

    appendHandlerMetadata(COMMAND_HANDLER_METADATA, target.constructor, { methodName: propertyKey, type });
  };
}
