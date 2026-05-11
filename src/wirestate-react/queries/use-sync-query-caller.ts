import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { SyncQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch synchronous queries.
 *
 * @remarks
 * The returned dispatcher returns the value directly from the handler
 * instead of a Promise (unless the handler itself returns a Promise).
 * Memoized using `useCallback`.
 *
 * @group queries
 *
 * @returns A synchronous query dispatcher function.
 *
 * @example
 * ```tsx
 * const querySync: SyncQueryCaller = useSyncQueryCaller();
 * const config: ApplicationConfig = querySync("GET_APP_CONFIG");
 * ```
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
