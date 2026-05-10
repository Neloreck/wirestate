import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { SyncQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @group queries
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
      return container.get(QueryBus).query(type, data);
    },
    [container]
  ) as SyncQueryCaller;
}
