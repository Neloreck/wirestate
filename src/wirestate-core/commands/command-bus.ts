import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import {
  CommandStatus,
  type CommandDescriptor,
  type CommandHandler,
  type CommandType,
  type CommandUnregister,
} from "../types/commands";
import { Maybe, Optional } from "../types/general";

/**
 * Orchestrates command dispatching and handler registration.
 *
 * @remarks
 * The `CommandBus` provides a way to decouple command dispatchers from their handlers.
 * It supports handler shadowing: when multiple handlers are registered for the same type,
 * the last registered one takes priority.
 *
 * @group Commands
 */
export class CommandBus {
  /**
   * Internal handler storage.
   * Uses a stack for each command type to support shadowing.
   */
  private readonly handlers: Map<CommandType, Array<CommandHandler>> = new Map();

  /**
   * Removes all registered command handlers from the bus.
   */
  public clear(): void {
    this.handlers.clear();
  }

  /**
   * Dispatches a command to the last registered handler.
   *
   * @remarks
   * Execution is always asynchronous. The handler's return value is wrapped in a Promise.
   * Returns a {@link CommandDescriptor} that tracks the execution status and task.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload data.
   *
   * @param type - Command identifier.
   * @param data - Optional payload for the handler.
   * @returns A descriptor for the executing command.
   *
   * @throws {@link WirestateError} If no handler is registered.
   *
   * @example
   * ```typescript
   * const descriptor: CommandDescriptor<User> = commandBus.command<User, string>("GET_USER", "id-123");
   * const user: User = await descriptor.task;
   * ```
   */
  public command<R = unknown, D = unknown>(type: CommandType, data?: D): CommandDescriptor<R> {
    const stack: Maybe<Array<CommandHandler>> = this.handlers.get(type);

    if (!stack?.length) {
      throw new WirestateError(
        ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER,
        `No command handler registered in container for type: '${String(type)}'.`
      );
    }

    const handler = stack[stack.length - 1] as CommandHandler<D, R>;

    const descriptor: CommandDescriptor<R> = {
      task: null as unknown as Promise<R>,
      status: CommandStatus.PENDING,
    };

    (descriptor as { task: Promise<R> }).task = Promise.resolve()
      .then(() => handler(data as D))
      .then((result: R) => {
        (descriptor as { status: CommandStatus }).status = CommandStatus.SETTLED;

        return result;
      })
      .catch((error: unknown) => {
        (descriptor as { status: CommandStatus }).status = CommandStatus.ERROR;

        throw error;
      });

    return descriptor as CommandDescriptor<R>;
  }

  /**
   * Dispatches a command if a handler exists, otherwise returns null.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload data.
   *
   * @param type - Command identifier.
   * @param data - Optional payload for the handler.
   * @returns A command descriptor, or `null` if no handler is found.
   */
  public commandOptional<R = unknown, D = unknown>(type: CommandType, data?: D): Optional<CommandDescriptor<R>> {
    const stack: Maybe<Array<CommandHandler>> = this.handlers.get(type);

    return stack?.length ? this.command<R, D>(type, data) : null;
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
   * Registers a handler for a specific command type.
   *
   * @remarks
   * If multiple handlers are registered for the same type, they are stored in a stack.
   * The most recently registered handler will be used for dispatching.
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

    let stack: Maybe<Array<CommandHandler>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    stack.push(handler as CommandHandler);

    return () => this.unregister(type, handler as CommandHandler);
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

    const current: Maybe<Array<CommandHandler>> = this.handlers.get(type);

    if (!current) {
      return;
    }

    const index: number = current.indexOf(handler as CommandHandler);

    if (index >= 0) {
      current.splice(index, 1);
    }

    // Clean empty stacks.
    if (current.length === 0) {
      this.handlers.delete(type);
    }
  }
}
