import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { OptionalSyncQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch synchronous optional queries.
 * Returns null instead of throwing when no handler is registered.
 *
 * @group queries
 *
 * @returns Optional sync query dispatcher.
 */
export function useOptionalSyncQueryCaller(): OptionalSyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional sync query data:", {
        type,
        data,
      });

      return container.get(QueryBus).queryOptional(type, data);
    },
    [container]
  ) as OptionalSyncQueryCaller;
}
