import { type QueryHandlerMetadata } from "./queries";

/**
 * Registry of class constructors to their declared query handlers.
 *
 * @remarks
 * Populated by the {@link OnQuery} decorator in legacy experimental mode.
 *
 * @group Queries
 * @internal
 */
export const QUERY_HANDLER_METADATA: WeakMap<object, Array<QueryHandlerMetadata>> = new WeakMap();

/**
 * Standard decorator metadata key for query handlers declared with {@link OnQuery}.
 *
 * @remarks
 * TC39 standard decorators store an `Array<QueryHandlerMetadata>` under this
 * key on the class `Symbol.metadata` object.
 *
 * @group Queries
 * @internal
 */
export const QUERY_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/query");
