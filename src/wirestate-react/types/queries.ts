import { QueryType } from "@wirestate/core";

import { MaybePromise, Optional } from "./general";

/**
 * Signature for a function that responds to a query.
 *
 * @group queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 *
 * @param data - Optional payload for the query.
 *
 * @returns The query result, possibly as a promise.
 */
export type QueryResponder<R = unknown, D = unknown> = (data?: D) => MaybePromise<R>;

/**
 * Signature for a function that dispatches queries and returns their result.
 *
 * @remarks
 * Typically returned by {@link useQueryCaller}.
 *
 * @group queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result as a value or promise.
 */
export type QueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => MaybePromise<R>;

/**
 * Signature for a function that dispatches synchronous queries.
 *
 * @remarks
 * Typically returned by {@link useSyncQueryCaller}.
 *
 * @group queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result directly.
 */
export type SyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => R;

/**
 * Signature for a function that dispatches optional queries.
 *
 * @remarks
 * Typically returned by {@link useOptionalQueryCaller}. Returns `null` when
 * no handler is registered.
 *
 * @group queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result, or `null` if no handler was found.
 */
export type OptionalQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<MaybePromise<R>>;

/**
 * Signature for a function that dispatches optional synchronous queries.
 *
 * @remarks
 * Typically returned by {@link useOptionalSyncQueryCaller}. Returns `null`
 * when no handler is registered.
 *
 * @group queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query result directly, or `null` if no handler was found.
 */
export type OptionalSyncQueryCaller = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<R>;
