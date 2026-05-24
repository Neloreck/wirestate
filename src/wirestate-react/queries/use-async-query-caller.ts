import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AsyncQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch async-capable queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link QueryBus.queryAsync} internally.
 *
 * @group Queries
 *
 * @returns An async query dispatcher function.
 *
 * @example
 * ```tsx
 * const queryAsync: AsyncQueryCaller = useAsyncQueryCaller();
 * const result: UserProfile = await queryAsync(GET_USER_PROFILE, { id: 123 });
 * ```
 */
export function useAsyncQueryCaller(): AsyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Async query data:", {
        type,
        data,
      });

      return container.get(QueryBus).queryAsync(type, data);
    },
    [container]
  ) as AsyncQueryCaller;
}
