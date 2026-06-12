import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import type { Optional } from "../../types/general";
import { HandlerStackBus } from "../bus/handler-stack-bus";

import { QueryHandler, QueryType, QueryUnregister } from "./queries";

/**
 * Dispatches named queries to one active handler.
 *
 * @remarks
 * Queries represent reads such as current user, labels, or cached state.
 * Handlers are stacked by type: the newest handler wins until it unregisters.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * import { QueryBus, Container } from "@wirestate/core";
 *
 * const container = new Container();
 * const bus = container.get(QueryBus);
 * bus.register("CURRENT_USER", () => ({ id: "u1" }));
 *
 * const user = bus.query<{ id: string }>("CURRENT_USER");
 * ```
 */
export class QueryBus extends HandlerStackBus<QueryType> {
  /**
   * Builds the error thrown when a required query dispatch finds no handler.
   *
   * @param type - Query identifier that failed to resolve.
   * @returns The error to throw.
   */
  protected createMissingHandlerError(type: QueryType): WirestateError {
    return new WirestateError(
      `No query handler registered in container for type: '${String(type)}'.`,
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER
    );
  }

  /**
   * Dispatches a query and returns the handler result as-is.
   *
   * @remarks
   * If a handler returns a Promise, this method returns that Promise. Use
   * {@link queryAsync} when the caller should always receive a Promise.
   *
   * @template R - Type of the expected query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param payload - Optional payload for the handler.
   * @returns The result of the query execution.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   *
   * @example
   * ```typescript
   * const user: User = queryBus.query<User, string>("FIND_USER", "user-id-123");
   * ```
   */
  public query<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): R {
    dbg.info(prefix(__filename), "Query:", { type, payload });

    return this.dispatch<R, P>(type, payload);
  }

  /**
   * Dispatches a query and Promise-wraps the result.
   *
   * @remarks
   * Sync values are wrapped. Async values are passed through.
   *
   * @template R - Type of the expected query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param payload - Optional payload for the handler.
   * @returns A Promise resolving to the query result.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   */
  public queryAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): Promise<R> {
    dbg.info(prefix(__filename), "Async query:", { type, payload });

    return this.dispatchAsync<R, P>(type, payload);
  }

  /**
   * Dispatches a query if a handler exists.
   *
   * @remarks
   * Returns the handler result as-is. Use {@link queryOptionalAsync} when the
   * caller should always receive a Promise.
   *
   * @template R - Type of the expected query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param payload - Optional payload for the handler.
   * @returns The query handler result as-is, or `null` if no handler is found.
   */
  public queryOptional<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): Optional<R> {
    dbg.info(prefix(__filename), "Query optional:", { type, payload });

    return this.dispatchOptional<R, P>(type, payload);
  }

  /**
   * Dispatches an optional query and Promise-wraps the result.
   *
   * @template R - Type of the expected query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param payload - Optional payload for the handler.
   * @returns A Promise resolving to the query result, or `null` if no handler is found.
   */
  public queryOptionalAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P
  ): Promise<Optional<R>> {
    dbg.info(prefix(__filename), "Optional async query:", { type, payload });

    return this.dispatchOptionalAsync<R, P>(type, payload);
  }

  /**
   * Registers a query handler.
   *
   * @remarks
   * Multiple handlers for one type form a stack. The newest handler answers.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
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
  public register<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    handler: QueryHandler<R, P, T>
  ): QueryUnregister {
    dbg.info(prefix(__filename), "Registering query handler:", {
      type,
      handler,
      bus: this,
    });

    return this.registerHandler<R, P>(type, handler);
  }

  /**
   * Removes a previously registered query handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Unique query identifier.
   * @param handler - The handler function instance to remove.
   */
  public unregister<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    handler: QueryHandler<R, P, T>
  ): void {
    dbg.info(prefix(__filename), "Unregistering query handler:", {
      type,
      handler,
      bus: this,
    });

    this.unregisterHandler<R, P>(type, handler);
  }
}
