import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryType } from "@/wirestate/types/queries";

/**
 * Dispatches a query on the provided container.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result
 */
export function query<R = unknown, D = unknown>(container: Container, type: TQueryType, data?: D): R | Promise<R> {
  dbg.info(prefix(__filename), "Query data:", type, data, container);

  return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data);
}
