import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QueryBus, QUERY_BUS, SyncQueryCaller, QueryType } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @returns sync query dispatcher
 */
export function useSyncQueryCaller(): SyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Sync query data:", {
        type,
        data,
      });

      // Access the container-scoped QueryBus and execute the query.
      return container.get<QueryBus>(QUERY_BUS).query(type, data);
    },
    [container]
  ) as SyncQueryCaller;
}
