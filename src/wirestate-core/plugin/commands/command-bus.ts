import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { Injectable } from "../../metadata/metadata-injectable";
import { type Optional } from "../../types/general";
import { HandlerStackBus } from "../bus/handler-stack-bus";

import { type CommandHandler, type CommandType, type CommandUnregister } from "./commands";

/**
 * Dispatches commands to one active handler per command type.
 *
 * @remarks
 * Commands represent write-oriented work such as save, login, reset, or send.
 * Handlers are stacked by type: the newest handler is active until it
 * unregisters.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * import { CommandBus, CommandsPlugin, Container } from "@wirestate/core";
 *
 * const container = new Container({ plugins: [new CommandsPlugin()] });
 * const bus = container.get(CommandBus);
 * bus.register("SAVE_USER", async (user: User) => saveUser(user));
 *
 * await bus.executeAsync<void, User>("SAVE_USER", user);
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
   * Dispatches a command and returns the handler result as-is.
   *
   * @remarks
   * If a handler returns a Promise, this method returns that Promise. Use
   * {@link executeAsync} when the caller should always receive a Promise.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @returns The command handler result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = commandBus.execute<User, string>("GET_USER", "id-123");
   * ```
   */
  public execute<R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): R {
    return this.dispatch<R, P>(type, payload);
  }

  /**
   * Dispatches a command and returns a Promise for the result.
   *
   * @remarks
   * Synchronous handler results are wrapped. Promises returned by handlers are
   * passed through.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @returns A Promise resolving to the command result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   */
  public executeAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): Promise<R> {
    return this.dispatchAsync<R, P>(type, payload);
  }

  /**
   * Dispatches a command if a handler exists.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command type.
   * @param payload - Optional payload for the handler.
   * @returns The command result, or `undefined` when no handler exists.
   */
  public executeOptional<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Optional<R> {
    return this.dispatchOptional<R, P>(type, payload);
  }

  /**
   * Dispatches an optional command and Promise-wraps the result.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Command type.
   *
   * @param type - Command type.
   * @param payload - Optional payload for the handler.
   * @returns A Promise resolving to the command result, or `undefined` if no handler is found.
   */
  public executeOptionalAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Promise<Optional<R>> {
    return this.dispatchOptionalAsync<R, P>(type, payload);
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
