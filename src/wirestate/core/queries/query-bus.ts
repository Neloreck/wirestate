import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { MaybePromise } from "@/wirestate/types/general";
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
  private readonly handlers = new Map<TQueryType, TQueryHandler[]>();

  /**
   * Registers a query handler.
   * Returns an unregister function.
   *
   * @param type - query type
   * @param handler - handler function
   * @returns unregister function
   */
  public register<D = unknown, R = unknown>(type: TQueryType, handler: TQueryHandler<D, R>): TQueryUnregister {
    let stack = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    stack.push(handler as TQueryHandler);

    return () => {
      const current = this.handlers.get(type);

      if (!current) {
        return;
      }

      const idx = current.indexOf(handler as TQueryHandler);

      if (idx >= 0) {
        current.splice(idx, 1);
      }

      // Cleanup empty stacks to keep the Map small.
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
   *
   * todo: Return null or standardized query response object, avoid throwing.
   */
  public query<R = unknown, D = unknown>(type: TQueryType, data?: D): MaybePromise<R> {
    const stack = this.handlers.get(type);

    // todo: Return null or standardized query response object, avoid throwing.
    if (!stack || stack.length === 0) {
      throw new WirestateError(
        ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
        `No query handler registered in container for type: '${String(type)}'.`
      );
    }

    // Always use the top of the stack (most recent registration).
    const top = stack[stack.length - 1] as TQueryHandler<D, R>;

    return top(data as D);
  }

  /**
   * Checks if a handler is registered for the given type.
   *
   * @param type - query type
   * @returns true if handler exists
   */
  public has(type: TQueryType): boolean {
    const stack = this.handlers.get(type);

    return stack !== undefined && stack.length > 0;
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
