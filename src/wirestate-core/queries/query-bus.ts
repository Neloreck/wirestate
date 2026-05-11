import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import type { Maybe, MaybePromise, Optional } from "../types/general";
import type { QueryHandler, QueryType, QueryUnregister } from "../types/queries";

/**
 * Orchestrates query dispatching and handler registration.
 *
 * @remarks
 * The `QueryBus` provides a request-response mechanism for decoupled communication.
 * It supports handler shadowing: when multiple handlers are registered for the same type,
 * the last registered one (e.g., at the component level) takes priority over earlier ones
 * (e.g., at the global service level).
 *
 * @group Queries
 */
export class QueryBus {
  /**
   * Internal handler storage.
   * Uses a stack for each query type to support shadowing (e.g., component-level vs service-level).
   */
  private readonly handlers: Map<QueryType, Array<QueryHandler>> = new Map();

  /**
   * Registers a handler for a specific query type.
   *
   * @remarks
   * If multiple handlers are registered for the same type, they are stored in a stack.
   * The most recently registered handler will be used for resolution.
   *
   * @template D - Type of the query input data.
   * @template R - Type of the query result.
   *
   * @param type - Unique query identifier.
   * @param handler - Function to execute when the query is dispatched.
   * @returns A function to unregister the handler.
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
   * Dispatches a query to the last registered handler and returns the result.
   *
   * @remarks
   * Query handlers can be synchronous or asynchronous. The result is returned as-is
   * (or as a Promise if the handler is async).
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
   * const user: User = await queryBus.query<User, string>("FIND_USER", "user-id-123");
   * ```
   */
  public query<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): MaybePromise<R> {
    const stack: Maybe<Array<QueryHandler>> = this.handlers.get(type);

    // Always use the top of the stack (most recent registration) if handlers are available.
    if (stack?.length) {
      return (stack[stack.length - 1] as QueryHandler<D, R>)(data as D);
    }

    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      `No query handler registered in container for type: '${String(type)}'.`
    );
  }

  /**
   * Dispatches a query if a handler exists, otherwise returns null.
   *
   * @template R - Type of the expected query result.
   * @template D - Type of the data (payload) passed to the query.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param data - Optional input data for the handler.
   * @returns The query result, or `null` if no handler is found.
   */
  public queryOptional<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Optional<MaybePromise<R>> {
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
