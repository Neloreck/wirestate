import { MaybePromise } from "./general";

/**
 * Represents token used to dispatch and handle commands.
 *
 * @remarks
 * Use strings for public commands and symbols for private/scoped commands to avoid name collisions.
 *
 * @group Commands
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
 * Represents the function that handles a command.
 *
 * @group Commands
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
 * Represents the function returned by command registration.
 *
 * Call it to remove that exact handler.
 *
 * @group Commands
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
 * @group Commands
 * @internal
 */
export interface CommandHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: CommandType;
}

/**
 * Represents the current state of a command execution.
 *
 * @group Commands
 */
export enum CommandStatus {
  /** The command has started but not yet completed. */
  PENDING = "pending",
  /** The command has successfully completed. */
  SUCCESS = "success",
  /** The command failed with an error. */
  ERROR = "error",
}

/**
 * Represents a running command execution.
 *
 * @remarks
 * Returned by the command bus when a command is dispatched. It allows tracking
 * the progress and result of the command execution.
 *
 * @group Commands
 *
 * @template R - Type of the result produced by the command.
 */
export interface CommandExecution<R = unknown> {
  /**
   * A promise that resolves with the command result or rejects with an error.
   */
  readonly result: Promise<R>;
  /**
   * The current execution status of the command.
   */
  readonly status: CommandStatus;
}
