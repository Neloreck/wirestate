import { MaybePromise, Optional } from "@/wirestate/types/general";

/**
 * Query identifier. Use symbols for private queries.
 */
export type TQueryType = string | symbol;

/**
 * Query handler signature.
 */
export type TQueryHandler<D = unknown, R = unknown> = (data: D) => MaybePromise<R>;

/**
 * Removes a query handler.
 */
export type TQueryUnregister = () => void;

/**
 * Metadata for `@OnQuery` decorated methods.
 *
 * @internal
 */
export interface IQueryHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: TQueryType;
}

/**
 * Public query responder signature.
 */
export type TQueryResponder<R = unknown, D = unknown> = (data?: D) => MaybePromise<R>;

/**
 * Dispatches queries and returns their result as a value or promise.
 */
export type TQueryCaller = <R = unknown, D = unknown, T extends TQueryType = TQueryType>(
  type: T,
  data?: D
) => MaybePromise<R>;

/**
 * Dispatches synchronous queries and returns their result directly.
 */
export type TSyncQueryCaller = <R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D) => R;

/**
 * Dispatches optional queries. Returns null when no handler is registered.
 */
export type TOptionalQueryCaller = <R = unknown, D = unknown, T extends TQueryType = TQueryType>(
  type: T,
  data?: D
) => Optional<MaybePromise<R>>;

/**
 * Dispatches optional synchronous queries. Returns null when no handler is registered.
 */
export type TOptionalSyncQueryCaller = <R = unknown, D = unknown, T extends TQueryType = TQueryType>(
  type: T,
  data?: D
) => Optional<R>;
