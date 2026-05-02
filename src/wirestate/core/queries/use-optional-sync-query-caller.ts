import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TOptionalSyncQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a stable function to dispatch synchronous optional queries.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional sync query dispatcher
 */
export function useOptionalSyncQueryCaller(): TOptionalSyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: TQueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional sync query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).queryOptional(type, data);
    },
    [container]
  ) as TOptionalSyncQueryCaller;
}
