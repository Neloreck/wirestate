import { CommandDescriptor, CommandType } from "@wirestate/core";

import { Optional } from "./general";

/**
 * Represents signature for a function that dispatches commands.
 *
 * @remarks
 * Typically returned by {@link useCommandCaller}. Dispatched commands are
 * automatically wrapped in a {@link CommandDescriptor}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command task.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A descriptor containing the execution task and status.
 */
export type CommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => CommandDescriptor<R>;

/**
 * Represents signature for a function that dispatches optional commands.
 *
 * @remarks
 * Typically returned by {@link useOptionalCommandCaller}. Returns `null` if no
 * handler is registered for the command type, instead of throwing.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command task.
 * @template D - The type of the data payload.
 * @template T - The command identifier type.
 *
 * @param type - The command identifier.
 * @param data - Optional payload for the command.
 *
 * @returns A descriptor if a handler was found, or `null` otherwise.
 */
export type OptionalCommandCaller = <R = unknown, D = unknown, T extends CommandType = CommandType>(
  type: T,
  data?: D
) => Optional<CommandDescriptor<R>>;
