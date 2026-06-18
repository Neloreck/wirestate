import { type QueryType } from "@wirestate/core";

import { type Optional } from "./general";

/**
 * Represents the function returned by {@link useQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useQueryExecutor}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template P - The type of the query payload.
 * @template T - The query type.
 *
 * @param type - The query type.
 * @param payload - Optional payload for the query.
 *
 * @returns The query handler result as-is.
 */
export type QueryExecutor = <R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P) => R;

/**
 * Represents the function returned by {@link useAsyncQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useAsyncQueryExecutor}.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template P - The type of the query payload.
 * @template T - The query type.
 *
 * @param type - The query type.
 * @param payload - Optional payload for the query.
 *
 * @returns A Promise resolving to the query result.
 */
export type AsyncQueryExecutor = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Promise<R>;

/**
 * Represents the function returned by {@link useOptionalQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalQueryExecutor}. Returns `undefined`
 * when no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template P - The type of the query payload.
 * @template T - The query type.
 *
 * @param type - The query type.
 * @param payload - Optional payload for the query.
 *
 * @returns The query handler result as-is, or `undefined` if no handler was found.
 */
export type OptionalQueryExecutor = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Optional<R>;

/**
 * Represents the function returned by {@link useOptionalAsyncQueryExecutor}.
 *
 * @remarks
 * Typically returned by {@link useOptionalAsyncQueryExecutor}. Returns `undefined`
 * when no handler is registered.
 *
 * @group Queries
 *
 * @template R - The result type of the query.
 * @template P - The type of the query payload.
 * @template T - The query type.
 *
 * @param type - The query type.
 * @param payload - Optional payload for the query.
 *
 * @returns A Promise resolving to the query result, or `undefined` if no handler was found.
 */
export type OptionalAsyncQueryExecutor = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Promise<Optional<R>>;
