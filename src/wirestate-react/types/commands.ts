import { CommandExecution, CommandType } from "@wirestate/core";

import { Optional } from "./general";

/**
 * Represents the function returned by {@link useCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useCommandExecutor}. Dispatched commands are
 * automatically wrapped in a {@link CommandExecution}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A command containing the execution promise and status.
 */
export type CommandExecutor = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => CommandExecution<R>;

/**
 * Represents the function returned by {@link useOptionalCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalCommandExecutor}. Returns `null` if no
 * handler is registered for the command type, instead of throwing.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A command if a handler was found, or `null` otherwise.
 */
export type OptionalCommandExecutor = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => Optional<CommandExecution<R>>;
