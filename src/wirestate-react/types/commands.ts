import { type CommandType } from "@wirestate/core";

import { type Optional } from "./general";

/**
 * Represents the function returned by {@link useCommandExecutor}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template P - The type of the command payload.
 * @template T - The command type.
 *
 * @param type - The command type.
 * @param payload - Optional payload for the command.
 *
 * @returns The command result as-is.
 */
export type CommandExecutor = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => R;

/**
 * Represents the function returned by {@link useCommandExecutorAsync}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template P - The type of the command payload.
 * @template T - The command type.
 *
 * @param type - The command type.
 * @param payload - Optional payload for the command.
 *
 * @returns A Promise resolving to the command result.
 */
export type CommandExecutorAsync = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Promise<R>;

/**
 * Represents the function returned by {@link useCommandExecutorOptional}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template P - The type of the command payload.
 * @template T - The command type.
 *
 * @param type - The command type.
 * @param payload - Optional payload for the command.
 *
 * @returns The command result, or `undefined` when no handler is registered.
 */
export type CommandExecutorOptional = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Optional<R>;

/**
 * Represents the function returned by {@link useCommandExecutorOptionalAsync}.
 *
 * @group Commands
 *
 * @template R - The expected result type of the command.
 * @template P - The type of the command payload.
 * @template T - The command type.
 *
 * @param type - The command type.
 * @param payload - Optional payload for the command.
 *
 * @returns A Promise resolving to the command result, or to `undefined` when no handler is registered.
 */
export type CommandExecutorOptionalAsync = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Promise<Optional<R>>;
