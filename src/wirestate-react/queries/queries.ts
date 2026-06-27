import { type QueryDispatchOptions, type QueryType } from "@wirestate/core";

import { type Optional } from "../types/general";

/**
 * Represents the function returned by {@link useQueryExecutor}.
 *
 * @remarks
 * Returns the query result as-is and throws when no handler is registered. Pass a
 * literal `{ optional: true }` so a missing handler returns `undefined` and the
 * result narrows to `Optional<R>`.
 *
 * @group Queries
 */
export interface QueryExecutor {
  <R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload: Optional<P>,
    options: QueryDispatchOptions & { optional: true }
  ): Optional<R>;
  <R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P, options?: QueryDispatchOptions): R;
}

/**
 * Represents the function returned by {@link useQueryExecutorAsync}.
 *
 * @remarks
 * Always resolves to a Promise, whether the handler is synchronous or
 * asynchronous. Pass a literal `{ optional: true }` so a missing handler resolves
 * to `undefined` and the result narrows to `Promise<Optional<R>>`.
 *
 * @group Queries
 */
export interface QueryExecutorAsync {
  <R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload: Optional<P>,
    options: QueryDispatchOptions & { optional: true }
  ): Promise<Optional<R>>;
  <R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P,
    options?: QueryDispatchOptions
  ): Promise<R>;
}
