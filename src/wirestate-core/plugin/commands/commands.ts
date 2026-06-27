import { type MaybePromise } from "../../types/general";

/**
 * Identifies a command and routes it to its handler.
 *
 * @remarks
 * Prefer strings for public commands and symbols for private ones to avoid collisions.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * const PUBLIC_COMMAND: CommandType = "USER/LOGIN";
 *
 * const PRIVATE_COMMAND: CommandType = Symbol("INTERNAL/SYNC");
 * ```
 */
export type CommandType = string | symbol | number;

/**
 * Handles a dispatched command and returns its result.
 *
 * @group Commands
 *
 * @template R - Result type, optionally a Promise.
 * @template P - Payload type.
 * @template T - Command type.
 *
 * @example
 * ```typescript
 * const loginHandler: CommandHandler<Session, Credentials> = (payload) => auth.login(payload);
 * ```
 */
export type CommandHandler<R = unknown, P = unknown, T extends CommandType = CommandType> = ((
  payload: P
) => MaybePromise<R>) & {
  readonly type?: T;
};

/**
 * Removes the command handler it was returned for.
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
