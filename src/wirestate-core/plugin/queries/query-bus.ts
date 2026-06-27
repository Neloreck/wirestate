import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";
import { Injectable } from "../../metadata/metadata-injectable";
import { type Optional } from "../../types/general";
import { HandlerStackBus } from "../bus/handler-stack-bus";

import { type QueryDispatchOptions, type QueryHandler, type QueryType, type QueryUnregister } from "./queries";

/**
 * Dispatches queries to the active handler for each query type.
 *
 * @remarks
 * Queries represent read-oriented work such as current user, labels, or cached
 * state. Handlers are stacked by type: the newest handler is active until it
 * unregisters. Required queries throw when no handler exists. Optional queries
 * return `undefined` for a miss.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * import { Container, QueriesPlugin, QueryBus } from "@wirestate/core";
 *
 * const container = new Container({ plugins: [new QueriesPlugin()] });
 * const bus = container.get(QueryBus);
 * const unregister = bus.register("CURRENT_USER", () => ({ id: "u1" }));
 *
 * const user = bus.query<{ id: string }>("CURRENT_USER");
 * unregister();
 * ```
 */
@Injectable()
export class QueryBus extends HandlerStackBus<QueryType> {
  /**
   * Builds the error thrown when a required query dispatch finds no handler.
   *
   * @param type - Query type that failed to resolve.
   * @returns The error to throw.
   */
  protected createMissingHandlerError(type: QueryType): WirestateError {
    return new WirestateError(
      `No query handler registered in container for type: '${String(type)}'.`,
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER
    );
  }

  /**
   * Dispatches an optional query and returns the handler result as-is.
   *
   * @remarks
   * Returns `undefined` when no handler exists. If a handler returns a Promise,
   * this returns that Promise. Pass a literal `{ optional: true }` so the result
   * narrows to `Optional<R>`.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
   *
   * @param type - Query type.
   * @param payload - Optional payload for the handler.
   * @param options - Dispatch options with `optional: true`.
   * @returns The query result, or `undefined` when no handler exists.
   */
  public query<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload: Optional<P>,
    options: QueryDispatchOptions & { optional: true }
  ): Optional<R>;

  /**
   * Dispatches a required query and returns the handler result as-is.
   *
   * @remarks
   * Throws when no handler is registered. If a handler returns a Promise, this
   * method returns that Promise. Use {@link queryAsync} when the caller should
   * always receive a Promise.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
   *
   * @param type - Query type.
   * @param payload - Optional payload for the handler.
   * @param options - Dispatch options.
   * @returns The result of the query execution.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   *
   * @example
   * ```typescript
   * const user: User = queryBus.query<User, string>("FIND_USER", "user-id-123");
   * ```
   */
  public query<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P,
    options?: QueryDispatchOptions
  ): R;

  public query<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P,
    options?: QueryDispatchOptions
  ): R | Optional<R> {
    return options?.optional ? this.dispatchOptional<R, P>(type, payload) : this.dispatch<R, P>(type, payload);
  }

  /**
   * Dispatches an optional query and returns a Promise for the result.
   *
   * @remarks
   * Synchronous handler results are wrapped. Resolves to `undefined` when no
   * handler exists. Pass a literal `{ optional: true }` so the result narrows to
   * `Optional<R>`.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
   *
   * @param type - Query type.
   * @param payload - Optional payload for the handler.
   * @param options - Dispatch options with `optional: true`.
   * @returns A Promise resolving to the query result, or `undefined` when no handler exists.
   */
  public queryAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload: Optional<P>,
    options: QueryDispatchOptions & { optional: true }
  ): Promise<Optional<R>>;

  /**
   * Dispatches a required query and returns a Promise for the result.
   *
   * @remarks
   * Throws when no handler is registered. Synchronous handler results are wrapped.
   * Promises returned by handlers are passed through.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
   *
   * @param type - Query type.
   * @param payload - Optional payload for the handler.
   * @param options - Dispatch options.
   * @returns A Promise resolving to the query result.
   *
   * @throws {@link WirestateError} If no handler is registered for the given type.
   */
  public queryAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P,
    options?: QueryDispatchOptions
  ): Promise<R>;

  public queryAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P,
    options?: QueryDispatchOptions
  ): Promise<R | Optional<R>> {
    return options?.optional
      ? this.dispatchOptionalAsync<R, P>(type, payload)
      : this.dispatchAsync<R, P>(type, payload);
  }

  /**
   * Registers a query handler.
   *
   * @remarks
   * Registering another handler for the same type shadows the previous one. Unregistering the newest restores it.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
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
    return this.registerHandler<R, P>(type, handler);
  }

  /**
   * Removes a previously registered query handler.
   *
   * @remarks
   * If the handler was not registered for the given type, this operation does nothing.
   *
   * @template R - Result type.
   * @template P - Payload type.
   * @template T - Query type.
   *
   * @param type - Query type.
   * @param handler - The handler function instance to remove.
   */
  public unregister<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    handler: QueryHandler<R, P, T>
  ): void {
    this.unregisterHandler<R, P>(type, handler);
  }
}
