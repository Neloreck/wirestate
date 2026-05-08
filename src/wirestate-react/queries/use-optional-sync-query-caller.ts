import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { OptionalSyncQueryCaller, QUERY_BUS, QueryBus, QueryType } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Returns a stable function to dispatch synchronous optional queries.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional sync query dispatcher
 */
export function useOptionalSyncQueryCaller(): OptionalSyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional sync query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS).queryOptional(type, data);
    },
    [container]
  ) as OptionalSyncQueryCaller;
}
