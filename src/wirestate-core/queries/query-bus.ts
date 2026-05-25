import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { Maybe, Optional } from "../types/general";
import { QueryHandler, QueryType, QueryUnregister } from "../types/queries";

/**
 * Dispatches named queries to one active handler.
 *
 * @remarks
 * Queries are reads: get current user, ask for a label, fetch cached state.
 *
 * Handlers are stacked by type. The newest handler wins. That lets a subtree
 * temporarily answer a query, then unregister and reveal the older answer.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * import { QueryBus, createContainer } from "@wirestate/core";
 *
 * const container = createContainer();
 * const bus = container.get(QueryBus);
 * bus.register("CURRENT_USER", () => ({ id: "u1" }));
 *
 * const user = bus.query<{ id: string }>("CURRENT_USER");
 * ```
 */
export class QueryBus {
  /**
   * Internal handler storage.
   * Uses a stack for each query type to support shadowing (e.g., component-level vs service-level).
   */
  private readonly handlers: Map<QueryType, Array<QueryHandler>> = new Map();

  /**
   * Registers a query handler.
   *
   * @remarks
   * Multiple handlers for one type form a stack. The newest handler answers.
   *
   * @template D - Type of the query input data.
   * @template R - Type of the query result.
   *
   * @param type - Query token.
   * @param handler - Query handler.
   * @returns Function that unregisters this handler.
   *
   * @example
   * ```typescript
   * const unregister: QueryUnregister = queryBus.register("GET_NOW", () => Date.now());
   * ```
   */
  public register<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): QueryUnregister {
    dbg.info(prefix(__filename), "Registering query handler:", {
      type,
      handler,
      bus: this,
    });

    let stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    stack.push(handler as QueryHandler);

    return () => this.unregister(type, handler as QueryHandler);
  }

  /**
   * Removes a previously registered query handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template D - Type of the query input data.
   * @template R - Type of the query result.
   *
   * @param type - Unique query identifier.
   * @param handler - The handler function instance to remove.
   */
  public unregister<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregistering query handler:", {
      type,
      handler,
      bus: this,
    });

    const current: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    if (!current) {
      return;
    }

    const index: number = current.indexOf(handler as QueryHandler);

    if (index >= 0) {
      current.splice(index, 1);
    }

    // Clean empty stacks.
    if (current.length === 0) {
      this.handlers.delete(type);
    }
  }

  /**
   * Dispatches a query and returns the handler result as-is.
   *
   * @remarks
   * If a handler returns a Promise, this method returns that Promise. Use
   * {@link queryAsync} when the caller should always receive a Promise.
   *
   * @template R - Type of the expected query result.
   * @template D - Type of the data (payload) passed to the query.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param data - Optional input data for the handler.
   * @returns The result of the query execution.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   *
   * @example
   * ```typescript
   * const user: User = queryBus.query<User, string>("FIND_USER", "user-id-123");
   * ```
   */
  public query<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): R {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    // Always use the top of the stack (most recent registration) if handlers are available.
    if (stack?.length) {
      return (stack[stack.length - 1] as QueryHandler<D, R>)(data as D) as R;
    }

    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      `No query handler registered in container for type: '${String(type)}'.`
    );
  }

  /**
   * Dispatches a query and Promise-wraps the result.
   *
   * @remarks
   * Sync values are wrapped. Async values are passed through.
   *
   * @template R - Type of the expected query result.
   * @template D - Type of the data (payload) passed to the query.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param data - Optional input data for the handler.
   * @returns A Promise resolving to the query result.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   */
  public async queryAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Promise<R> {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    if (stack?.length) {
      return (stack[stack.length - 1] as QueryHandler<D, R>)(data as D);
    }

    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      `No query handler registered in container for type: '${String(type)}'.`
    );
  }

  /**
   * Dispatches a query if a handler exists.
   *
   * @remarks
   * Returns the handler result as-is. Use {@link queryOptionalAsync} when the
   * caller should always receive a Promise.
   *
   * @template R - Type of the expected query result.
   * @template D - Type of the data (payload) passed to the query.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param data - Optional input data for the handler.
   * @returns The synchronous query result, or `null` if no handler is found.
   */
  public queryOptional<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Optional<R> {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    if (stack?.length) {
      return (stack[stack.length - 1] as QueryHandler<D, R>)(data as D) as R;
    }

    return null;
  }

  /**
   * Dispatches an optional query and Promise-wraps the result.
   *
   * @template R - Type of the expected query result.
   * @template D - Type of the data (payload) passed to the query.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param data - Optional input data for the handler.
   * @returns A Promise resolving to the query result, or `null` if no handler is found.
   */
  public async queryOptionalAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Promise<Optional<R>> {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    if (stack?.length) {
      return (stack[stack.length - 1] as QueryHandler<D, R>)(data as D);
    }

    return null;
  }

  /**
   * Checks if at least one handler is registered for the given query type.
   *
   * @param type - Unique query identifier.
   * @returns `true` if a handler is available, `false` otherwise.
   */
  public has(type: QueryType): boolean {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    return Boolean(stack && stack.length);
  }

  /**
   * Removes all registered query handlers from the bus.
   *
   * @internal
   */
  public clear(): void {
    this.handlers.clear();
  }
}
