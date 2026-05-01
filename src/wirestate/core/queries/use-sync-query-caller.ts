import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TSyncQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @returns sync query dispatcher
 */
export function useSyncQueryCaller<R = unknown, D = unknown, T extends TQueryType = TQueryType>(): TSyncQueryCaller<
  R,
  D,
  T
> {
  const container: Container = useContainer();

  return useCallback(
    (type: T, data?: D) => {
      dbg.info(prefix(__filename), "Sync query data:", {
        type,
        data,
      });

      // Access the container-scoped QueryBus and execute the query.
      return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D, T>(type, data) as R;
    },

    [container]
  );
}
