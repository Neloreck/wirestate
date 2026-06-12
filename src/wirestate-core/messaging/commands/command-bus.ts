import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import type { Optional } from "../../types/general";
import { HandlerStackBus } from "../bus/handler-stack-bus";

import type { CommandHandler, CommandType, CommandUnregister } from "./commands";

/**
 * Dispatches named commands to one active handler.
 *
 * @remarks
 * Commands represent writes such as save, login, reset, or send. Handlers are
 * stacked by type: the newest handler wins until it unregisters.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * import { CommandBus } from "@wirestate/core";
 *
 * const bus = new CommandBus();
 * bus.register("SAVE_USER", async (user: User) => saveUser(user));
 *
 * await bus.executeAsync<void, User>("SAVE_USER", user);
 * ```
 */
export class CommandBus extends HandlerStackBus<CommandType> {
  /**
   * Builds the error thrown when a required command dispatch finds no handler.
   *
   * @param type - Command identifier that failed to resolve.
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
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
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
    dbg.info(prefix(__filename), "Execute command:", { type, payload });

    return this.dispatch<R, P>(type, payload);
  }

  /**
   * Dispatches a command and Promise-wraps the result.
   *
   * @remarks
   * Sync values are wrapped. Async values are passed through.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command token.
   * @param payload - Command payload.
   * @returns A Promise resolving to the command result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   */
  public executeAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): Promise<R> {
    dbg.info(prefix(__filename), "Execute async command:", { type, payload });

    return this.dispatchAsync<R, P>(type, payload);
  }

  /**
   * Dispatches a command if a handler exists.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Optional payload for the handler.
   * @returns The command result, or `null` when no handler exists.
   */
  public executeOptional<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Optional<R> {
    dbg.info(prefix(__filename), "Execute optional command:", { type, payload });

    return this.dispatchOptional<R, P>(type, payload);
  }

  /**
   * Dispatches an optional command and Promise-wraps the result.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Optional payload for the handler.
   * @returns A Promise resolving to the command result, or `null` if no handler is found.
   */
  public executeOptionalAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Promise<Optional<R>> {
    dbg.info(prefix(__filename), "Execute optional async command:", { type, payload });

    return this.dispatchOptionalAsync<R, P>(type, payload);
  }

  /**
   * Registers a command handler.
   *
   * @remarks
   * Multiple handlers for one type form a stack. The newest handler is active.
   *
   * @template R - Type of the command execution result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
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
    dbg.info(prefix(__filename), "Registering command handler:", {
      type,
      handler,
      bus: this,
    });

    return this.registerHandler<R, P>(type, handler);
  }

  /**
   * Removes a previously registered command handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template R - Type of the command execution result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param handler - The handler function instance to remove.
   */
  public unregister<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    handler: CommandHandler<R, P, T>
  ): void {
    dbg.info(prefix(__filename), "Unregistering command handler:", {
      type,
      handler,
      bus: this,
    });

    this.unregisterHandler<R, P>(type, handler);
  }
}
