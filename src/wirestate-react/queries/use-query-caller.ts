import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { QueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link QueryBus.query} internally.
 *
 * @group queries
 *
 * @returns A query dispatcher function.
 *
 * @example
 * ```tsx
 * const query: QueryCaller = useQueryCaller();
 * const result: UserProfile = await query(GET_USER_PROFILE, { id: 123 });
 * ```
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
