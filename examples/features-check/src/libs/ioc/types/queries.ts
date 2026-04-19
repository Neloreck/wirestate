/**
 * Query identifier. Use symbols for private queries.
 */
export type TQueryType = string | symbol;

/**
 * Query handler signature.
 */
export type TQueryHandler<D = unknown, R = unknown> = (
  data: D,
) => R | Promise<R>;

/**
 * Removes a query handler.
 */
export type TQueryUnregister = () => void;

/**
 * Metadata for `@OnQuery` decorated methods.
 * @internal
 */
export interface IQueryHandlerMetadata {
  readonly methodName: string | symbol;
  readonly type: TQueryType;
}

/**
 * Public query responder signature.
 */
export type TQueryResponder<R = unknown, D = unknown> = (
  data?: D,
) => R | Promise<R>;
