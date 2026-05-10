import type { MaybePromise } from "./general";

/**
 * Command identifier. Use symbols for private commands.
 *
 * @group commands
 */
export type CommandType = string | symbol;

/**
 * Command handler signature.
 *
 * @group commands
 */
export type CommandHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Removes a command handler.
 *
 * @group commands
 */
export type CommandUnregister = () => void;

/**
 * Metadata for `@OnCommand` decorated methods.
 *
 * @internal
 * @group commands
 */
export interface CommandHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: CommandType;
}

/**
 * Command execution status.
 *
 * @group commands
 */
export enum CommandStatus {
  PENDING = "pending",
  SETTLED = "settled",
  ERROR = "error",
}

/**
 * Descriptor returned by command execution.
 * Contains the task promise, current status, and responder with result/error.
 *
 * @group commands
 */
export interface CommandDescriptor<R = unknown> {
  readonly task: Promise<R>;
  readonly status: CommandStatus;
}
