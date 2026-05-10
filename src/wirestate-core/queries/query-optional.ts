import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { MaybePromise, Optional } from "../types/general";
import type { QueryType } from "../types/queries";

import { QueryBus } from "./query-bus";

/**
 * Dispatches a query on the provided container, returning null if no handler is registered.
 *
 * @group queries
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result or null
 */
export function queryOptional<R = unknown, D = unknown>(
  container: Container,
  type: QueryType,
  data?: D
): Optional<MaybePromise<R>> {
  dbg.info(prefix(__filename), "Optional query data:", type, data, container);

  return container.get(QueryBus).queryOptional<R, D>(type, data);
}
