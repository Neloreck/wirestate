import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a function to dispatch queries on the active container.
 *
 * @returns query dispatcher
 */
export function useQueryCaller<R = unknown, D = unknown, T extends TQueryType = TQueryType>(): TQueryCaller<R, D, T> {
  const container: Container = useContainer();

  return useCallback(
    (type: T, data?: D) => {
      dbg.info(prefix(__filename), "Query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).query<R, D, T>(type, data);
    },
    [container]
  );
}
