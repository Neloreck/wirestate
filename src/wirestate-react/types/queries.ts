import { type QueryType } from "@wirestate/core";

import { type Optional } from "./general";

/**
 * Represents the function returned by {@link useQueryExecutor}.
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
 * @returns The query result as-is.
 */
export type QueryExecutor = <R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P) => R;

/**
 * Represents the function returned by {@link useQueryExecutorAsync}.
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
export type QueryExecutorAsync = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Promise<R>;

/**
 * Represents the function returned by {@link useQueryExecutorOptional}.
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
 * @returns The query result, or `undefined` when no handler is registered.
 */
export type QueryExecutorOptional = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Optional<R>;

/**
 * Represents the function returned by {@link useQueryExecutorOptionalAsync}.
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
 * @returns A Promise resolving to the query result, or to `undefined` when no handler is registered.
 */
export type QueryExecutorOptionalAsync = <R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  payload?: P
) => Promise<Optional<R>>;
