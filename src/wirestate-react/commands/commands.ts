import { type CommandDispatchOptions, type CommandType } from "@wirestate/core";

import { type Optional } from "../types/general";

/**
 * Represents the function returned by {@link useCommandExecutor}.
 *
 * @remarks
 * Returns the command result as-is and throws when no handler is registered. Pass
 * a literal `{ optional: true }` so a missing handler returns `undefined` and the
 * result narrows to `Optional<R>`.
 *
 * @group Commands
 */
export interface CommandExecutor {
  <R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload: Optional<P>,
    options: CommandDispatchOptions & { optional: true }
  ): Optional<R>;
  <R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): R;
}

/**
 * Represents the function returned by {@link useCommandExecutorAsync}.
 *
 * @remarks
 * Always resolves to a Promise, whether the handler is synchronous or
 * asynchronous. Pass a literal `{ optional: true }` so a missing handler resolves
 * to `undefined` and the result narrows to `Promise<Optional<R>>`.
 *
 * @group Commands
 */
export interface CommandExecutorAsync {
  <R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload: Optional<P>,
    options: CommandDispatchOptions & { optional: true }
  ): Promise<Optional<R>>;
  <R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): Promise<R>;
}
