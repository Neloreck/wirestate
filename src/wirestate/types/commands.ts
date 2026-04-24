import { MaybePromise } from "@/wirestate/types/general";

/**
 * Command identifier. Use symbols for private commands.
 */
export type TCommandType = string | symbol;

/**
 * Command handler signature.
 */
export type TCommandHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Command calling function signature.
 */
export type TCommandCaller<R = unknown, D = unknown, T extends TCommandType = TCommandType> = (
  type: T,
  data?: D
) => ICommandDescriptor<R>;

/**
 * Removes a command handler.
 */
export type TCommandUnregister = () => void;

/**
 * Metadata for `@OnCommand` decorated methods.
 *
 * @internal
 */
export interface ICommandHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: TCommandType;
}

/**
 * Command execution status.
 */
export enum ECommandStatus {
  PENDING = "pending",
  SETTLED = "settled",
  ERROR = "error",
}

/**
 * Descriptor returned by command execution.
 * Contains the task promise, current status, and responder with result/error.
 */
export interface ICommandDescriptor<R = unknown> {
  readonly task: Promise<R>;
  readonly status: ECommandStatus;
}
