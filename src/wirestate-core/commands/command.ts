import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { CommandDescriptor, CommandType } from "../types/commands";

import { CommandBus } from "./command-bus";

/**
 * Dispatches a command through the {@link CommandBus} resolved from the container.
 *
 * @remarks
 * This is a convenience wrapper around the `CommandBus.command` method.
 * Commands allow for decoupled communication between services.
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
 * @returns A descriptor to track the command execution and result.
 *
 * @example
 * ```typescript
 * const descriptor = command<User, UserFindParameters>(
 *   container,
 *   "FIND_USER",
 *   { id: "123" }
 * );
 *
 * const user: User = await descriptor.task;
 * ```
 */
export function command<R = unknown, D = unknown, T extends CommandType = CommandType>(
  container: Container,
  type: T,
  data?: D
): CommandDescriptor<R> {
  dbg.info(prefix(__filename), "Command:", type, data, container);

  return container.get(CommandBus).command<R, D>(type, data);
}
