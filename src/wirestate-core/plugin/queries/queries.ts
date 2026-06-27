import { type MaybePromise } from "../../types/general";

/**
 * Identifies a query and routes it to its handler.
 *
 * @remarks
 * Prefer symbols for private queries to avoid name collisions.
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
 * @group Queries
 *
 * @template R - Result type, optionally a Promise.
 * @template P - Payload type.
 * @template T - Query type.
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
 * const unregister: QueryUnregister = queryBus.register("GET_USER", handler);
 *
 * unregister();
 * ```
 */
export type QueryUnregister = () => void;

/**
 * Metadata for `@OnQuery` decorated methods.
 *
 * @group Queries
 * @internal
 */
export interface QueryHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: QueryType;
}
