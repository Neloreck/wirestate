import { Container } from "inversify";
import { useCallback } from "react";

import { useContainer } from "@/wirestate/core/provision/useContainer";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryType } from "@/wirestate/types/queries";

import { QueryBus } from "./QueryBus";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
export function useQueryCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown>(type: TQueryType, data?: D) =>
      container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data),
    [container]
  );
}
