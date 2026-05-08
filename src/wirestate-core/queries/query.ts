import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QueryBus } from "@/wirestate-core/queries/query-bus";
import type { MaybePromise } from "@/wirestate-core/types/general";
import type { TQueryType } from "@/wirestate-core/types/queries";

/**
 * Dispatches a query on the provided container.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result
 */
export function query<R = unknown, D = unknown>(container: Container, type: TQueryType, data?: D): MaybePromise<R> {
  dbg.info(prefix(__filename), "Query data:", type, data, container);

  return container.get(QueryBus).query<R, D>(type, data);
}
