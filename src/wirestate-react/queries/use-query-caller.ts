import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { QueryCaller } from "../types/queries";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @group queries
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

      return container.get(QueryBus).query(type, data);
    },
    [container]
  ) as QueryCaller;
}
