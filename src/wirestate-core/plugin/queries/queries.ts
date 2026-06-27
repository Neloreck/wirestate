import { type MaybePromise } from "../../types/general";

/**
 * Identifies a query and routes it to its handler.
 *
 * @remarks
 * Queries use a request-response pattern. Using symbols is recommended for
 * private or internal queries to avoid naming collisions.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * const GET_USER_QUERY: QueryType = Symbol("GET_USER");
 * ```
 */
export type QueryType = string | symbol | number;

/**
 * Answers a dispatched query and returns its result.
 *
 * @remarks
 * Query handlers can be synchronous or asynchronous. They receive a payload
 * and must return a result (or a Promise resolving to it).
 *
 * @group Queries
 *
 * @template R - Type of the returned result.
 * @template P - Type of the query payload.
 * @template T - Type of the query.
 *
 * @example
 * ```typescript
 * const handler: QueryHandler<User, string> = (userId) => userRepository.find(userId);
 * ```
 */
export type QueryHandler<R = unknown, P = unknown, T extends QueryType = QueryType> = ((
  payload: P
) => MaybePromise<R>) & {
  readonly type?: T;
};

/**
 * Removes the query handler it was returned for.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * const unregister: QueryUnregister = queryBus.register("QUERY_TYPE", handler);
 *
 * unregister(); // Handler is no longer active
 * ```
 */
export type QueryUnregister = () => void;

/**
 * Describes metadata for methods decorated with {@link OnQuery}.
 *
 * @remarks
 * This interface is used internally to track which methods should be registered
 * on the {@link QueryBus} during instance activation.
 *
 * @group Queries
 * @internal
 */
export interface QueryHandlerMetadata {
  /**
   * The name of the method on the class prototype.
   */
  readonly methodName: string | symbol;
  /**
   * The query type this method handles.
   */
  readonly type: QueryType;
}
