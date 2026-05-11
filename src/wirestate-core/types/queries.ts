import { MaybePromise } from "./general";

/**
 * Unique identifier for a query.
 *
 * @remarks
 * Queries use a request-response pattern. Using symbols is recommended for
 * private or internal queries to avoid naming collisions.
 *
 * @group queries
 *
 * @example
 * ```typescript
 * const GET_USER_QUERY: QueryType = Symbol("GET_USER");
 * ```
 */
export type QueryType = string | symbol;

/**
 * Signature for a function that handles queries of a specific type.
 *
 * @remarks
 * Query handlers can be synchronous or asynchronous. They receive a payload
 * and must return a result (or a Promise resolving to it).
 *
 * @group queries
 *
 * @template D - Type of the input data (payload).
 * @template R - Type of the returned result.
 *
 * @example
 * ```typescript
 * const handler: QueryHandler<string, User> = (userId) => userRepository.find(userId);
 * ```
 */
export type QueryHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Function returned by registration methods to remove a query handler.
 *
 * @group queries
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
 * Metadata descriptor for methods decorated with {@link OnQuery}.
 *
 * @remarks
 * This interface is used internally to track which methods should be registered
 * on the {@link QueryBus} during service activation.
 *
 * @group queries
 * @internal
 */
export interface QueryHandlerMetadata {
  /**
   * The name of the method on the class prototype.
   */
  readonly methodName: string | symbol;
  /**
   * The query identifier this method handles.
   */
  readonly type: QueryType;
}
