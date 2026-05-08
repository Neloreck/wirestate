import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER } from "@/wirestate/error/error-code";
import { WirestateError } from "@/wirestate/error/wirestate-error";
import {
  ECommandStatus,
  type ICommandDescriptor,
  type TCommandHandler,
  type TCommandType,
  type TCommandUnregister,
} from "@/wirestate/types/commands";
import type { Maybe, Optional } from "@/wirestate/types/general";

/**
 * Dispatches commands to handlers.
 * Scoped to a container under {@link COMMAND_BUS_TOKEN}.
 *
 * Unlike queries, command execution always wraps the handler in a promise
 * and returns a descriptor with task, status, and responder.
 */
export class CommandBus {
  /**
   * Internal handler storage.
   * Uses a stack for each command type to support shadowing.
   */
  private readonly handlers: Map<TCommandType, Array<TCommandHandler>> = new Map();

  /**
   * Registers a command handler.
   * Returns an unregister function.
   *
   * @param type - command type
   * @param handler - handler function
   * @returns unregister function
   */
  public register<D = unknown, R = unknown>(type: TCommandType, handler: TCommandHandler<D, R>): TCommandUnregister {
    dbg.info(prefix(__filename), "Registering command handler:", {
      type,
      handler,
      bus: this,
    });

    let stack: Maybe<Array<TCommandHandler>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    stack.push(handler as TCommandHandler);

    return () => {
      dbg.info(prefix(__filename), "Unregistering command handler:", {
        type,
        handler,
        bus: this,
      });

      const current: Maybe<Array<TCommandHandler>> = this.handlers.get(type);

      if (!current) {
        return;
      }

      const index: number = current.indexOf(handler as TCommandHandler);

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
  public command<R = unknown, D = unknown>(type: TCommandType, data?: D): ICommandDescriptor<R> {
    const stack: Maybe<Array<TCommandHandler>> = this.handlers.get(type);

    if (!stack?.length) {
      throw new WirestateError(
        ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER,
        `No command handler registered in container for type: '${String(type)}'.`
      );
    }

    const handler = stack[stack.length - 1] as TCommandHandler<D, R>;

    const descriptor: ICommandDescriptor<R> = {
      task: null as unknown as Promise<R>,
      status: ECommandStatus.PENDING,
    };

    (descriptor as { task: Promise<R> }).task = Promise.resolve()
      .then(() => handler(data as D))
      .then((result: R) => {
        (descriptor as { status: ECommandStatus }).status = ECommandStatus.SETTLED;

        return result;
      })
      .catch((error: unknown) => {
        (descriptor as { status: ECommandStatus }).status = ECommandStatus.ERROR;

        throw error;
      });

    return descriptor as ICommandDescriptor<R>;
  }

  /**
   * Dispatches a command to the last registered handler, returning null if no handler exists.
   *
   * @param type - command type
   * @param data - command payload
   * @returns command descriptor or null if no handler is registered
   */
  public commandOptional<R = unknown, D = unknown>(type: TCommandType, data?: D): Optional<ICommandDescriptor<R>> {
    const stack: Maybe<Array<TCommandHandler>> = this.handlers.get(type);

    return stack?.length ? this.command<R, D>(type, data) : null;
  }

  /**
   * Checks if a handler is registered for the given type.
   *
   * @param type - command type
   * @returns true if handler exists
   */
  public has(type: TCommandType): boolean {
    return Boolean(this.handlers.get(type)?.length);
  }

  /**
   * Removes all registered handlers.
   */
  public clear(): void {
    this.handlers.clear();
  }
}
