import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_BUS, QueryBus, QueryCaller, QueryType } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
export function useQueryCaller(): QueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS).query(type, data);
    },
    [container]
  ) as QueryCaller;
}
