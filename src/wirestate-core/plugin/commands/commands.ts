import { type MaybePromise } from "../../types/general";

/**
 * Identifies one imperative message handled by a command handler.
 *
 * @remarks
 * Commands represent write-oriented work such as save, login, reset, etc.
 * Prefer strings for public command contracts and symbols for private commands
 * that should not collide with other packages.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * const LOGIN: CommandType = "USER/LOGIN";
 *
 * const LOCAL_RESET: CommandType = Symbol("LOCAL_RESET");
 * ```
 */
export type CommandType = string | symbol | number;

/**
 * Handles a dispatched command payload and returns the command result.
 *
 * @remarks
 * A handler may return a plain value or a Promise. `CommandBus.execute(...)`
 * returns that result as-is. `CommandBus.executeAsync(...)` Promise-normalizes it.
 *
 * @group Commands
 *
 * @template R - Result type, optionally a Promise.
 * @template P - Payload type.
 * @template T - Command type.
 *
 * @example
 * ```typescript
 * const loginHandler: CommandHandler<Session, Credentials> = (credentials) => auth.login(credentials);
 * ```
 */
export type CommandHandler<R = unknown, P = unknown, T extends CommandType = CommandType> = ((
  payload: P
) => MaybePromise<R>) & {
  readonly type?: T;
};

/**
 * Removes one command handler registration.
 *
 * @remarks
 * The callback returned by `CommandBus.register(...)` removes that exact
 * registration. If a command has a shadowed handler underneath it, unregistering
 * the active handler restores the previous one.
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
 * Per-dispatch options for {@link CommandBus.execute} and {@link CommandBus.executeAsync}.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * const receipt = commandBus.execute<Receipt>("UPLOAD", draft, { optional: true });
 * ```
 */
export interface CommandDispatchOptions {
  /**
   * Allows a missing handler and returns `undefined` instead of throwing.
   */
  readonly optional?: boolean;
}

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
