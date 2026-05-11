import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { MaybePromise, Optional } from "../types/general";
import type { QueryType } from "../types/queries";

import { QueryBus } from "./query-bus";

/**
 * Dispatches a query through the {@link QueryBus}, returning null if no handler is registered.
 *
 * @remarks
 * This is a convenience wrapper around the `QueryBus.queryOptional` method.
 * Use this when the query resolution is optional and you want to avoid catching errors.
 *
 * @group Queries
 *
 * @template R - Type of the expected query result.
 * @template D - Type of the input data (payload).
 *
 * @param container - Inversify {@link Container} to resolve the {@link QueryBus} from.
 * @param type - Unique query identifier.
 * @param data - Optional input data for the query handler.
 * @returns The query result or `null` if no handler exists.
 *
 * @example
 * ```typescript
 * const config: Config | null = await queryOptional<Config>(container, "GET_OPTIONAL_CONFIG");
 * ```
 */
export function queryOptional<R = unknown, D = unknown>(
  container: Container,
  type: QueryType,
  data?: D
): Optional<MaybePromise<R>> {
  dbg.info(prefix(__filename), "Optional query data:", type, data, container);

  return container.get(QueryBus).queryOptional<R, D>(type, data);
}
