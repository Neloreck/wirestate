import { collectHandlerMetadata } from "../../metadata/metadata-handlers";
import { type MessagingHandlerDecorator, createMessagingDecorator } from "../messaging-decorator";
import { type MessagingRegistration } from "../messaging-registration";

import { CommandBus } from "./command-bus";
import { type CommandHandler, type CommandHandlerMetadata, type CommandType } from "./commands";
import { COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY } from "./commands-registry";

/**
 * Wires an instance's `@OnCommand` methods onto the {@link CommandBus}.
 *
 * @remarks
 * Declared beside the commands code so importing `@OnCommand` (or {@link CommandsPlugin})
 * is what pulls {@link CommandBus} into the bundle. The dispatcher stays bus-agnostic.
 *
 * @internal
 */
export const COMMAND_REGISTRATION: MessagingRegistration = {
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
export type OnCommandDecorator = MessagingHandlerDecorator;

const decorate = createMessagingDecorator<CommandHandlerMetadata>({
  name: "OnCommand",
  registry: COMMAND_HANDLER_METADATA,
  metadataKey: COMMAND_METADATA_KEY,
  registration: COMMAND_REGISTRATION,
});

/**
 * Marks an injectable service method as a provision-scoped command handler.
 *
 * @remarks
 * The handler is registered when the owning container is provisioned and
 * unregistered when that provision cycle ends. Register {@link CommandsPlugin}
 * on the container, or on an ancestor container, to enable command handlers.
 *
 * One command call goes to one handler: the newest registered handler for the
 * command token. The method receives the command payload and may return either a
 * plain value or a Promise.
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
 *   public onUserLogin(credentials: Credentials): Promise<Session> {
 *     return auth.login(credentials);
 *   }
 * }
 * ```
 */
export function OnCommand(type: CommandType): OnCommandDecorator {
  return decorate((methodName: string | symbol): CommandHandlerMetadata => ({ methodName, type }));
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
  return collectHandlerMetadata(instance, COMMAND_HANDLER_METADATA, COMMAND_METADATA_KEY);
}
