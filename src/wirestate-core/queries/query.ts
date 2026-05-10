import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { MaybePromise } from "../types/general";
import type { QueryType } from "../types/queries";

import { QueryBus } from "./query-bus";

/**
 * Dispatches a query on the provided container.
 *
 * @group queries
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result
 */
export function query<R = unknown, D = unknown>(container: Container, type: QueryType, data?: D): MaybePromise<R> {
  dbg.info(prefix(__filename), "Query data:", type, data, container);

  return container.get(QueryBus).query<R, D>(type, data);
}
