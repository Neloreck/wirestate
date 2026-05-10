import { MaybePromise } from "./general";

/**
 * Query identifier. Use symbols for private queries.
 *
 * @group queries
 */
export type QueryType = string | symbol;

/**
 * Query handler signature.
 *
 * @group queries
 */
export type QueryHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Removes a query handler.
 *
 * @group queries
 */
export type QueryUnregister = () => void;

/**
 * Metadata for `@OnQuery` decorated methods.
 *
 * @group queries
 * @internal
 */
export interface QueryHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: QueryType;
}
