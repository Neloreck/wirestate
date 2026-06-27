import { type MaybePromise } from "../../types/general";

/**
 * Identifies one read-oriented message handled by a query handler.
 *
 * @remarks
 * Queries represent request/response reads such as current user, labels, cached
 * state, or computed view data. Prefer strings for public query contracts and
 * symbols for private queries that should not collide with other packages.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * const CURRENT_USER: QueryType = "USER/CURRENT";
 *
 * const LOCAL_SUMMARY: QueryType = Symbol("LOCAL_SUMMARY");
 * ```
 */
export type QueryType = string | symbol | number;

/**
 * Answers a dispatched query payload and returns the query result.
 *
 * @remarks
 * A handler may return a plain value or a Promise. `QueryBus.query(...)`
 * returns that result as-is. `QueryBus.queryAsync(...)` Promise-normalizes it.
 *
 * @group Queries
 *
 * @template R - Result type, optionally a Promise.
 * @template P - Payload type.
 * @template T - Query type.
 *
 * @example
 * ```typescript
 * const currentUserHandler: QueryHandler<User> = () => userRepository.current();
 * ```
 */
export type QueryHandler<R = unknown, P = unknown, T extends QueryType = QueryType> = ((
  payload: P
) => MaybePromise<R>) & {
  readonly type?: T;
};

/**
 * Removes one query handler registration.
 *
 * @remarks
 * The callback returned by `QueryBus.register(...)` removes that exact
 * registration. If a query has a shadowed handler underneath it, unregistering
 * the active handler restores the previous one.
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
