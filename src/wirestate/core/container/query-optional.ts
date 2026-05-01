import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { MaybePromise, Optional } from "@/wirestate/types/general";
import type { TQueryType } from "@/wirestate/types/queries";

/**
 * Dispatches a query on the provided container, returning null if no handler is registered.
 *
 * @param container - inversify container
 * @param type - query type
 * @param data - query data
 * @returns query result or null
 */
export function queryOptional<R = unknown, D = unknown>(
  container: Container,
  type: TQueryType,
  data?: D
): Optional<MaybePromise<R>> {
  dbg.info(prefix(__filename), "Optional query data:", type, data, container);

  return container.get<QueryBus>(QUERY_BUS_TOKEN).queryOptional<R, D>(type, data);
}
