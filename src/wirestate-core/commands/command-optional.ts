import { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandDescriptor, CommandType } from "../types/commands";
import { Optional } from "../types/general";

import { CommandBus } from "./command-bus";

/**
 * Dispatches a command through the {@link CommandBus} resolved from the container, returning null if no handler exists.
 *
 * @remarks
 * This is a convenience wrapper around the `CommandBus.commandOptional` method.
 * Unlike {@link command}, it does not throw if no handler is registered.
 *
 * @group Commands
 *
 * @template R - Type of the expected result from the command execution.
 * @template D - Type of the data (payload) passed to the command.
 * @template T - Type of the command identifier.
 *
 * @param container - Inversify {@link Container} to resolve the {@link CommandBus} from.
 * @param type - Unique identifier of the command to dispatch.
 * @param data - Optional payload for the command handler.
 * @returns A {@link CommandDescriptor} if a handler was found, or `null` otherwise.
 *
 * @example
 * ```typescript
 * const descriptor = commandOptional<User, FindUserOptions>(
 *   container,
 *   "FIND_USER",
 *   { id: "123" }
 * );
 *
 * if (descriptor) {
 *   const user: User = await descriptor.task;
 * }
 * ```
 */
export function commandOptional<R = unknown, D = unknown, T extends CommandType = CommandType>(
  container: Container,
  type: T,
  data?: D
): Optional<CommandDescriptor<R>> {
  dbg.info(prefix(__filename), "Optional command:", type, data, container);

  return container.get(CommandBus).commandOptional<R, D>(type, data);
}
