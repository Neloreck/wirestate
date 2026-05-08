import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate-react/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
export function useQueryCaller(): TQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: TQueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).query(type, data);
    },
    [container]
  ) as TQueryCaller;
}
