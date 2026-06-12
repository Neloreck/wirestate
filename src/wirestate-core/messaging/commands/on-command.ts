import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { validateStandardMethodContext } from "../../metadata/metadata-decorator-context";
import { appendHandlerMetadata, appendStandardHandlerMetadata } from "../../metadata/metadata-handlers";
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY } from "../../metadata/metadata-registry";

import type { CommandType } from "./commands";

/**
 * Describes the decorator returned by {@link OnCommand}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Commands
 */
export interface OnCommandHandlerDecorator {
  // Standard (TC39):
  <This>(value: (this: This, ...args: Array<never>) => unknown, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

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
export function OnCommand(type: CommandType): OnCommandHandlerDecorator {
  return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      const metadata: DecoratorMetadataObject = validateStandardMethodContext("OnCommand", nameOrContext);

      dbg.info(prefix(__filename), "Attaching OnCommand metadata (TC39):", {
        type,
        propertyKey: nameOrContext.name,
        context: nameOrContext,
      });

      appendStandardHandlerMetadata(metadata, COMMAND_METADATA_KEY, { methodName: nameOrContext.name, type });
    } else {
      // Experimental legacy decorators:
      dbg.info(prefix(__filename), "Attaching OnCommand metadata:", {
        name: target.constructor.name,
        type,
        propertyKey: nameOrContext,
        target,
        constructor: target.constructor,
      });

      appendHandlerMetadata(COMMAND_HANDLER_METADATA, target.constructor, { methodName: nameOrContext, type });
    }
  }) as OnCommandHandlerDecorator;
}
