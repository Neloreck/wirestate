import type { MaybePromise } from "./general";

/**
 * Represents identifier used to dispatch and handle commands.
 *
 * @remarks
 * Use strings for public commands and symbols for private/scoped commands to avoid name collisions.
 *
 * @group commands
 *
 * @example
 * ```typescript
 * const PUBLIC_COMMAND: CommandType = "USER/LOGIN";
 *
 * const PRIVATE_COMMAND: CommandType = Symbol("INTERNAL/SYNC");
 *
 * enum CounterCommand {
 *   INCREMENT = "COUNTER/INCREMENT",
 *   DECREMENT = "COUNTER/DECREMENT",
 * }
 * ```
 */
export type CommandType = string | symbol;

/**
 * Represents function signature for handling command execution.
 *
 * @group commands
 *
 * @template D - Type of the input payload (data) for the command.
 * @template R - Type of the result returned by the handler (can be wrapped in a Promise).
 *
 * @example
 * ```typescript
 * const loginHandler: CommandHandler<Credentials, Session> = (payload) => {
 *   return auth.login(payload);
 * };
 * ```
 */
export type CommandHandler<D = unknown, R = unknown> = (payload: D) => MaybePromise<R>;

/**
 * Represents function returned when a command handler is registered.
 * Calling this function removes the handler from the command bus.
 *
 * @group commands
 *
 * @example
 * ```typescript
 * const unregister: CommandUnregister = commandBus.register("MY_COMMAND", handler);
 *
 * unregister();
 * ```
 */
export type CommandUnregister = () => void;

/**
 * Metadata for `@OnCommand` decorated methods.
 *
 * @group commands
 * @internal
 */
export interface CommandHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: CommandType;
}

/**
 * Represents the current state of a command execution.
 *
 * @group commands
 */
export enum CommandStatus {
  /** The command task has started but not yet completed. */
  PENDING = "pending",
  /** The command task has successfully completed. */
  SETTLED = "settled",
  /** The command task failed with an error. */
  ERROR = "error",
}

/**
 * Represents a handle to an executing command.
 *
 * @remarks
 * Returned by the command bus when a command is dispatched. It allows tracking
 * the progress and outcome of the command execution.
 *
 * @group commands
 *
 * @template R - Type of the result produced by the command.
 */
export interface CommandDescriptor<R = unknown> {
  /**
   * A promise that resolves with the command result or rejects with an error.
   */
  readonly task: Promise<R>;
  /**
   * The current execution status of the command.
   */
  readonly status: CommandStatus;
}
