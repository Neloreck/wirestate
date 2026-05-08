import type { MaybePromise } from "./general";

/**
 * Command identifier. Use symbols for private commands.
 */
export type CommandType = string | symbol;

/**
 * Command handler signature.
 */
export type CommandHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Removes a command handler.
 */
export type CommandUnregister = () => void;

/**
 * Metadata for `@OnCommand` decorated methods.
 *
 * @internal
 */
export interface CommandHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: CommandType;
}

/**
 * Command execution status.
 */
export enum CommandStatus {
  PENDING = "pending",
  SETTLED = "settled",
  ERROR = "error",
}

/**
 * Descriptor returned by command execution.
 * Contains the task promise, current status, and responder with result/error.
 */
export interface CommandDescriptor<R = unknown> {
  readonly task: Promise<R>;
  readonly status: CommandStatus;
}
