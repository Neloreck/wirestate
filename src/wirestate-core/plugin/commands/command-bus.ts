import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { Injectable } from "../../metadata/metadata-injectable";
import { type Optional } from "../../types/general";
import { HandlerStackBus } from "../bus/handler-stack-bus";

import { type CommandDispatchOptions, type CommandHandler, type CommandType, type CommandUnregister } from "./commands";

/**
 * Dispatches commands to the active handler for each command type.
 *
 * @remarks
 * Commands represent write-oriented work such as save, login, reset, or send.
 * Handlers are stacked by type: the newest handler is active until it
 * unregisters.
 * Required execution throws when no handler exists. Optional
 * execution returns `undefined` for a miss.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * import { CommandBus, CommandsPlugin, Container } from "@wirestate/core";
 *
 * const container = new Container({ plugins: [new CommandsPlugin()] });
 * const bus = container.get(CommandBus);
 * const unregister = bus.register<void, User>("SAVE_USER", async (user: User) => {
 *   // persist the user
 * });
 *
 * await bus.executeAsync<void, User>("SAVE_USER", { id: "u1" });
 * unregister();
 * ```
 */
@Injectable()
export class CommandBus extends HandlerStackBus<CommandType> {
  /**
   * Builds the error thrown when a required command dispatch finds no handler.
   *
   * @param type - Command type that failed to resolve.
   * @returns The error to throw.
   */
  protected createMissingHandlerError(type: CommandType): WirestateError {
    return new WirestateError(
      `No command handler registered in container for type: '${String(type)}'.`,
      ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER
    );
  }

  /**
   * Dispatches an optional command and returns the handler result as-is.
   *
   * @remarks
   * Returns `undefined` when no handler exists. If a handler returns a Promise,
   * this returns that Promise. Pass a literal `{ optional: true }` so the result
   * narrows to `Optional<R>`.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @param options - Dispatch options with `optional: true`.
   * @returns The command result, or `undefined` when no handler exists.
   */
  public execute<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload: Optional<P>,
    options: CommandDispatchOptions & { optional: true }
  ): Optional<R>;

  /**
   * Dispatches a required command and returns the handler result as-is.
   *
   * @remarks
   * Throws when no handler is registered. If a handler returns a Promise, this
   * returns that Promise. Use {@link executeAsync} when the caller should always
   * receive a Promise.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @param options - Dispatch options.
   * @returns The command handler result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   *
   * @example
   * ```typescript
   * const saved: SaveResult = commandBus.execute<SaveResult, Draft>("SAVE_DRAFT", draft);
   * ```
   */
  public execute<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): R;

  public execute<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): R | Optional<R> {
    return options?.optional ? this.dispatchOptional<R, P>(type, payload) : this.dispatch<R, P>(type, payload);
  }

  /**
   * Dispatches an optional command and returns a Promise for the result.
   *
   * @remarks
   * Synchronous handler results are wrapped. Resolves to `undefined` when no
   * handler exists. Pass a literal `{ optional: true }` so the result narrows to
   * `Optional<R>`.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @param options - Dispatch options with `optional: true`.
   * @returns A Promise resolving to the command result, or `undefined` when no handler exists.
   */
  public executeAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload: Optional<P>,
    options: CommandDispatchOptions & { optional: true }
  ): Promise<Optional<R>>;

  /**
   * Dispatches a required command and returns a Promise for the result.
   *
   * @remarks
   * Throws when no handler is registered. Synchronous handler results are wrapped.
   * Promises returned by handlers are passed through.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @param options - Dispatch options.
   * @returns A Promise resolving to the command result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   */
  public executeAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): Promise<R>;

  public executeAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P,
    options?: CommandDispatchOptions
  ): Promise<R | Optional<R>> {
    return options?.optional
      ? this.dispatchOptionalAsync<R, P>(type, payload)
      : this.dispatchAsync<R, P>(type, payload);
  }

  /**
   * Registers a command handler.
   *
   * @remarks
   * Registering another handler for the same type shadows the previous one. Unregistering the newest restores it.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command type.
   * @param handler - Function to execute when the command is dispatched.
   * @returns A function to unregister the handler.
   *
   * @example
   * ```typescript
   * const unregister: CommandUnregister = commandBus.register("LOG_MESSAGE", (message: string) => {
   *   console.log(message);
   * });
   * ```
   */
  public register<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    handler: CommandHandler<R, P, T>
  ): CommandUnregister {
    return this.registerHandler<R, P>(type, handler);
  }

  /**
   * Removes a previously registered command handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command type.
   * @param handler - The handler function instance to remove.
   */
  public unregister<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    handler: CommandHandler<R, P, T>
  ): void {
    this.unregisterHandler<R, P>(type, handler);
  }
}
