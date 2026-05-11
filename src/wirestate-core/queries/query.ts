import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { MaybePromise } from "../types/general";
import type { QueryType } from "../types/queries";

import { QueryBus } from "./query-bus";

/**
 * Dispatches a query through the {@link QueryBus} resolved from the container.
 *
 * @remarks
 * This is a convenience wrapper around the `QueryBus.query` method.
 * Queries allow for decoupled request-response communication between services.
 *
 * @group queries
 *
 * @template R - Type of the expected query result.
 * @template D - Type of the input data (payload).
 *
 * @param container - Inversify {@link Container} to resolve the {@link QueryBus} from.
 * @param type - Unique query identifier.
 * @param data - Optional input data for the query handler.
 * @returns The query result (can be a Promise).
 *
 * @throws {@link WirestateError} If no query handler is registered.
 *
 * @example
 * ```typescript
 * const result: string = await query<string, FindUserParameters>(
 *   container,
 *   "GET_USER_NAME",
 *   { id: 123 }
 * );
 * ```
 */
export function query<R = unknown, D = unknown>(container: Container, type: QueryType, data?: D): MaybePromise<R> {
  dbg.info(prefix(__filename), "Query data:", type, data, container);

  return container.get(QueryBus).query<R, D>(type, data);
}
