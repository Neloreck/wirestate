import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "@/wirestate/error/error-code";
import { WirestateError } from "@/wirestate/error/wirestate-error";
import type { Maybe, MaybePromise, Optional } from "@/wirestate/types/general";
import type { TQueryHandler, TQueryType, TQueryUnregister } from "@/wirestate/types/queries";

/**
 * Dispatches queries to handlers.
 * Scoped to a container under {@link QUERY_BUS_TOKEN}.
 */
export class QueryBus {
  /**
   * Internal handler storage.
   * Uses a stack for each query type to support shadowing (e.g., component-level vs service-level).
   */
  private readonly handlers: Map<TQueryType, Array<TQueryHandler>> = new Map();

  /**
   * Registers a query handler.
   * Returns an unregister function.
   *
   * @param type - query type
   * @param handler - handler function
   * @returns unregister function
   */
  public register<D = unknown, R = unknown>(type: TQueryType, handler: TQueryHandler<D, R>): TQueryUnregister {
    dbg.info(prefix(__filename), "Registering query handler:", {
      type,
      handler,
      bus: this,
    });

    let stack: Maybe<Array<TQueryHandler>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    stack.push(handler as TQueryHandler);

    return () => {
      dbg.info(prefix(__filename), "Unregistering query handler:", {
        type,
        handler,
        bus: this,
      });

      const current: Maybe<Array<TQueryHandler>> = this.handlers.get(type);

      if (!current) {
        return;
      }

      const index: number = current.indexOf(handler as TQueryHandler);

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
   * Dispatches a query to the last registered handler.
   *
   * @param type - query type
   * @param data - query payload
   * @returns query result
   *
   * @throws if no handler is registered
   */
  public query<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): MaybePromise<R> {
    const stack: Maybe<Array<TQueryHandler>> = this.handlers.get(type);

    // Always use the top of the stack (most recent registration) if handlers are available.
    if (stack?.length) {
      return (stack[stack.length - 1] as TQueryHandler<D, R>)(data as D);
    }

    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      `No query handler registered in container for type: '${String(type)}'.`
    );
  }

  /**
   * Dispatches a query to the last registered handler, returning null if no handler exists.
   *
   * @param type - query type
   * @param data - query payload
   * @returns query result or null if no handler is registered
   */
  public queryOptional<R = unknown, D = unknown, T extends TQueryType = TQueryType>(
    type: T,
    data?: D
  ): Optional<MaybePromise<R>> {
    const stack: Maybe<Array<TQueryHandler>> = this.handlers.get(type);

    if (stack?.length) {
      return (stack[stack.length - 1] as TQueryHandler<D, R>)(data as D);
    }

    return null;
  }

  /**
   * Checks if a handler is registered for the given type.
   *
   * @param type - query type
   * @returns true if handler exists
   */
  public has(type: TQueryType): boolean {
    const stack: Maybe<Array<TQueryHandler>> = this.handlers.get(type);

    return Boolean(stack && stack.length);
  }

  /**
   * Removes all registered handlers.
   *
   * @internal
   */
  public clear(): void {
    this.handlers.clear();
  }
}
