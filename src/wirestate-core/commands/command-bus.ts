import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "@/wirestate-core/error/error-code";
import { WirestateError } from "@/wirestate-core/error/wirestate-error";
import {
  CommandStatus,
  type CommandDescriptor,
  type CommandHandler,
  type CommandType,
  type CommandUnregister,
} from "@/wirestate-core/types/commands";
import type { Maybe, Optional } from "@/wirestate-core/types/general";

/**
 * Dispatches commands to handlers.
 *
 * Unlike queries, command execution always wraps the handler in a promise
 * and returns a descriptor with task, status, and responder.
 */
export class CommandBus {
  /**
   * Internal handler storage.
   * Uses a stack for each command type to support shadowing.
   */
  private readonly handlers: Map<CommandType, Array<CommandHandler>> = new Map();

  /**
   * Registers a command handler.
   * Returns an unregister function.
   *
   * @param type - command type
   * @param handler - handler function
   * @returns unregister function
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

    return () => {
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
    };
  }

  /**
   * Dispatches a command to the last registered handler.
   * Wraps the handler execution in a promise and returns a descriptor.
   *
   * @param type - command type
   * @param data - command payload
   * @returns command descriptor with task, status, and responder
   *
   * @throws if no handler is registered
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
   * Dispatches a command to the last registered handler, returning null if no handler exists.
   *
   * @param type - command type
   * @param data - command payload
   * @returns command descriptor or null if no handler is registered
   */
  public commandOptional<R = unknown, D = unknown>(type: CommandType, data?: D): Optional<CommandDescriptor<R>> {
    const stack: Maybe<Array<CommandHandler>> = this.handlers.get(type);

    return stack?.length ? this.command<R, D>(type, data) : null;
  }

  /**
   * Checks if a handler is registered for the given type.
   *
   * @param type - command type
   * @returns true if handler exists
   */
  public has(type: CommandType): boolean {
    return Boolean(this.handlers.get(type)?.length);
  }

  /**
   * Removes all registered handlers.
   */
  public clear(): void {
    this.handlers.clear();
  }
}
