import { Container } from "inversify";
import { useCallback } from "react";

import { useContainer } from "../provision/useContainer";
import { QUERY_BUS_TOKEN } from "../registry";
import type { TQueryType } from "../types/queries";

import type { QueryBus } from "./QueryBus";

/**
 * Returns a stable function to dispatch synchronous queries.
 * Returns the value directly from the handler.
 *
 * @returns sync query dispatcher
 */
export function useSyncQueryCaller(): <R = unknown, D = unknown>(type: TQueryType, data?: D) => R {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown>(type: TQueryType, data?: D) =>
      // Access the container-scoped QueryBus and execute the query.
      container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data) as R,
    [container]
  );
}
