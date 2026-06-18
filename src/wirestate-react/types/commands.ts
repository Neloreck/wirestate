import { type CommandType } from "@wirestate/core";

import { type Optional } from "./general";

/**
 * Represents the function returned by {@link useCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useCommandExecutor}. Returns the command handler
 * result as-is. Use {@link useAsyncCommandExecutor} when consumers should
 * consistently receive a Promise.
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
 * @returns The command result.
 */
export type CommandExecutor = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => R;

/**
 * Represents the function returned by {@link useAsyncCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useAsyncCommandExecutor}. Sync command results
 * are wrapped, and async command results are passed through.
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
export type AsyncCommandExecutor = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Promise<R>;

/**
 * Represents the function returned by {@link useOptionalCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalCommandExecutor}. Returns `undefined` if no
 * handler is registered for the command type, instead of throwing.
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
 * @returns The command result if a handler was found, or `undefined` otherwise.
 */
export type OptionalCommandExecutor = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Optional<R>;

/**
 * Represents the function returned by {@link useOptionalAsyncCommandExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalAsyncCommandExecutor}. Returns `undefined`
 * if no handler is registered for the command type.
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
 * @returns A Promise resolving to the command result, or `undefined` if no handler was found.
 */
export type OptionalAsyncCommandExecutor = <R = unknown, P = unknown, T extends CommandType = CommandType>(
  type: T,
  payload?: P
) => Promise<Optional<R>>;
