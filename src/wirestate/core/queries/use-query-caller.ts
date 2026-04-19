import { Container } from "inversify";
import { useCallback } from "react";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
export function useQueryCaller() {
  const container: Container = useContainer();

  return useCallback(
    <R = unknown, D = unknown>(type: TQueryType, data?: D) => {
      log.info(prefix(__filename), "Query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data);
    },
    [container]
  );
}
