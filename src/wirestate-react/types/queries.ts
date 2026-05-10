import { QueryType } from "@wirestate/core";

import { MaybePromise, Optional } from "./general";

/**
 * Public query responder signature.
 *
 * @group queries
 */
export type QueryResponder<R = unknown, D = unknown> = (data?: D) => MaybePromise<R>;

/**
 * Dispatches queries and returns their result as a value or promise.
 *
 * @group queries
 */
export type QueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => MaybePromise<R>;

/**
 * Dispatches synchronous queries and returns their result directly.
 *
 * @group queries
 */
export type SyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => R;

/**
 * Dispatches optional queries. Returns null when no handler is registered.
 *
 * @group queries
 */
export type OptionalQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<MaybePromise<R>>;

/**
 * Dispatches optional synchronous queries. Returns null when no handler is registered.
 *
 * @group queries
 */
export type OptionalSyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<R>;
