import { Container } from "inversify";
import { useCallback } from "react";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @returns sync query dispatcher
 */
export function useSyncQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => R {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown>(type: TQueryType, data?: D) => {
      log.info(prefix(__filename), "Sync query data:", {
        type,
        data,
      });

      // Access the container-scoped QueryBus and execute the query.
      return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data) as R;
    },

    [container]
  );
}
