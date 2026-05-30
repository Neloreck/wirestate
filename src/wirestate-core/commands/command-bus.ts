import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import {
  type CommandExecution,
  CommandStatus,
  type CommandHandler,
  type CommandType,
  type CommandUnregister,
} from "../types/commands";
import { Maybe, Optional } from "../types/general";

interface CommandHandlerDescriptor {
  handler: CommandHandler;
}

/**
 * Dispatches named commands to one active handler.
 *
 * @remarks
 * Commands are writes: save, login, reset, send. The caller gets a
 * {@link CommandExecution} immediately and can await `execution.result`.
 *
 * Handlers are stacked by type. The newest handler wins. Unregister it and the
 * previous handler takes over again.
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
 * const execution = bus.execute<void, User>("SAVE_USER", user);
 * await execution.result;
 * ```
 */
export class CommandBus {
  /**
   * Internal handler storage.
   * Uses a stack for each command type to support shadowing.
   */
  private readonly handlers: Map<CommandType, Array<CommandHandlerDescriptor>> = new Map();

  /**
   * Removes all registered command handlers from the bus.
   */
  public clear(): void {
    this.handlers.clear();
  }

  /**
   * Dispatches a command to the newest handler.
   *
   * @remarks
   * The handler result is always wrapped in a Promise. The command starts
   * as `PENDING`, then becomes `SUCCESS` or `ERROR`.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload data.
   *
   * @param type - Command token.
   * @param data - Command payload.
   * @returns The running command handle.
   *
   * @throws {@link WirestateError} If no handler is registered.
   *
   * @example
   * ```typescript
   * const execution: CommandExecution<User> = commandBus.execute<User, string>("GET_USER", "id-123");
   * const user: User = await execution.result;
   * ```
   */
  public execute<R = unknown, D = unknown>(type: CommandType, data?: D): CommandExecution<R> {
    const stack: Maybe<Array<CommandHandlerDescriptor>> = this.handlers.get(type);

    if (!stack?.length) {
      throw new WirestateError(
        ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER,
        `No command handler registered in container for type: '${String(type)}'.`
      );
    }

    const handler = stack[stack.length - 1].handler as CommandHandler<D, R>;

    const execution: CommandExecution<R> = {
      result: null as unknown as Promise<R>,
      status: CommandStatus.PENDING,
    };

    (execution as { result: Promise<R> }).result = Promise.resolve()
      .then(() => handler(data as D))
      .then((result: R) => {
        (execution as { status: CommandStatus }).status = CommandStatus.SUCCESS;

        return result;
      })
      .catch((error: unknown) => {
        (execution as { status: CommandStatus }).status = CommandStatus.ERROR;

        throw error;
      });

    return execution as CommandExecution<R>;
  }

  /**
   * Dispatches a command if a handler exists.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload data.
   *
   * @param type - Command identifier.
   * @param data - Optional payload for the handler.
   * @returns The running command execution, or `null` when no handler exists.
   */
  public executeOptional<R = unknown, D = unknown>(type: CommandType, data?: D): Optional<CommandExecution<R>> {
    return this.handlers.get(type)?.length ? this.execute<R, D>(type, data) : null;
  }

  /**
   * Checks if at least one handler is registered for the given command type.
   *
   * @param type - Command identifier.
   * @returns `true` if a handler is available, `false` otherwise.
   */
  public has(type: CommandType): boolean {
    return Boolean(this.handlers.get(type)?.length);
  }

  /**
   * Registers a command handler.
   *
   * @remarks
   * Multiple handlers for one type form a stack. The newest handler is active.
   *
   * @template D - Type of the command payload data.
   * @template R - Type of the command execution result.
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
  public register<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): CommandUnregister {
    dbg.info(prefix(__filename), "Registering command handler:", {
      type,
      handler,
      bus: this,
    });

    let stack: Maybe<Array<CommandHandlerDescriptor>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    const registration: CommandHandlerDescriptor = {
      handler: handler as CommandHandler,
    };

    stack.push(registration);

    return () => {
      dbg.info(prefix(__filename), "Unregistering command handler with callback:", {
        type,
        handler: registration.handler,
        bus: this,
      });

      const current: Maybe<Array<CommandHandlerDescriptor>> = this.handlers.get(type);

      if (!current) {
        return;
      }

      let index: number = -1;

      for (let it: number = 0; it < current.length; it += 1) {
        if (current[it] === registration) {
          index = it;
          break;
        }
      }

      if (index >= 0) {
        current.splice(index, 1);
      }

      // Clean empty stacks.
      if (current.length === 0) {
        this.handlers.delete(type);
      }
    };
  }

  /**
   * Removes a previously registered command handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template D - Type of the command payload data.
   * @template R - Type of the command execution result.
   *
   * @param type - Command identifier.
   * @param handler - The handler function instance to remove.
   */
  public unregister<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregistering command handler:", {
      type,
      handler,
      bus: this,
    });

    const current: Maybe<Array<CommandHandlerDescriptor>> = this.handlers.get(type);

    if (!current) {
      return;
    }

    let index: number = -1;

    for (let it: number = current.length - 1; it >= 0; it -= 1) {
      if (current[it].handler === (handler as CommandHandler)) {
        index = it;
        break;
      }
    }

    if (index >= 0) {
      current.splice(index, 1);
    }

    // Clean empty stacks.
    if (current.length === 0) {
      this.handlers.delete(type);
    }
  }
}
