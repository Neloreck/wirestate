import { QueryType } from "@wirestate/core";

import { Optional } from "./general";

/**
 * Represents the function returned by {@link useQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useQueryExecutor}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query handler result as-is.
 */
export type QueryExecutor = <R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D) => R;

/**
 * Represents the function returned by {@link useAsyncQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useAsyncQueryExecutor}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns A Promise resolving to the query result.
 */
export type AsyncQueryExecutor = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Promise<R>;

/**
 * Represents the function returned by {@link useOptionalQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalQueryExecutor}. Returns `null` when
 * no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns The query handler result as-is, or `null` if no handler was found.
 */
export type OptionalQueryExecutor = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Optional<R>;

/**
 * Represents the function returned by {@link useOptionalAsyncQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalAsyncQueryExecutor}. Returns `null`
 * when no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template D - The type of the data payload.
 * @template T - The query identifier type.
 *
 * @param type - The query identifier.
 * @param data - Optional payload for the query.
 *
 * @returns A Promise resolving to the query result, or `null` if no handler was found.
 */
export type OptionalAsyncQueryExecutor = <R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  data?: D
) => Promise<Optional<R>>;
