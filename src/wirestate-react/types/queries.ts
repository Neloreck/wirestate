import { QueryType } from "@wirestate/core";

import { MaybePromise, Optional } from "@/wirestate-react/types/general";

/**
 * Public query responder signature.
 */
export type QueryResponder<R = unknown, D = unknown> = (data?: D) => MaybePromise<R>;

/**
 * Dispatches queries and returns their result as a value or promise.
 */
export type QueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => MaybePromise<R>;

/**
 * Dispatches synchronous queries and returns their result directly.
 */
export type SyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => R;

/**
 * Dispatches optional queries. Returns null when no handler is registered.
 */
export type OptionalQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<MaybePromise<R>>;

/**
 * Dispatches optional synchronous queries. Returns null when no handler is registered.
 */
export type OptionalSyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<R>;
