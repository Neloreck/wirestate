import { MaybePromise } from "@/wirestate-core/types/general";

/**
 * Query identifier. Use symbols for private queries.
 */
export type QueryType = string | symbol;

/**
 * Query handler signature.
 */
export type QueryHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Removes a query handler.
 */
export type QueryUnregister = () => void;

/**
 * Metadata for `@OnQuery` decorated methods.
 *
 * @internal
 */
export interface QueryHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: QueryType;
}
