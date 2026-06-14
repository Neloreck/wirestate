import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { validateStandardMethodContext } from "../../metadata/metadata-decorator-context";
import {
  appendHandlerMetadata,
  appendStandardHandlerMetadata,
  collectHandlerMetadata,
} from "../../metadata/metadata-handlers";
import { MESSAGING_REGISTRATION_KEY, MESSAGING_REGISTRATIONS } from "../messaging-registration";

import { CommandBus } from "./command-bus";
import type { CommandHandler, CommandHandlerMetadata, CommandType } from "./commands";
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY } from "./commands-registry";

/**
 * Wires an instance's `@OnCommand` methods onto the {@link CommandBus} at activation.
 *
 * @remarks
 * Declared beside the commands code so importing `@OnCommand` is what pulls
 * {@link CommandBus} into the bundle; the activation dispatcher stays bus-agnostic.
 *
 * @internal
 */
const COMMAND_REGISTRATION = {
  kind: Symbol("@wirestate/core/messaging/command"),
  token: CommandBus,
  register: (bus: object, instance: object): Array<() => void> => {
    const commandBus: CommandBus = bus as CommandBus;
    const disposers: Array<() => void> = [];

    for (const meta of getCommandHandlerMetadata(instance)) {
      const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

      if (typeof method !== "function") {
        continue;
      }

      disposers.push(commandBus.register(meta.type, (method as CommandHandler).bind(instance)));
    }

    return disposers;
  },
};

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
      appendStandardHandlerMetadata(metadata, MESSAGING_REGISTRATION_KEY, COMMAND_REGISTRATION);
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
      appendHandlerMetadata(MESSAGING_REGISTRATIONS, target.constructor, COMMAND_REGISTRATION);
    }
  }) as OnCommandHandlerDecorator;
}

/**
 * Retrieves `@OnCommand` metadata from the class hierarchy.
 *
 * @remarks
 * Traverses the prototype chain to collect all command handlers.
 * Returns metadata ordered from base class to derived class to ensure parent-first execution.
 *
 * @group Commands
 * @internal
 *
 * @param instance - The instance to inspect.
 * @returns A read-only array of metadata for all discovered command handlers.
 */
export function getCommandHandlerMetadata(instance: object): ReadonlyArray<CommandHandlerMetadata> {
  dbg.info(prefix(__filename), "Resolving instance command metadata:", {
    name: instance.constructor.name,
    instance,
  });

  return collectHandlerMetadata(instance, COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY);
}
