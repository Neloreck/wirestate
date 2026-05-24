import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { QueryExecutor } from "../types/queries";

/**
 * Returns a stable function to dispatch synchronous queries on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It uses {@link QueryBus.query} internally.
 * Use {@link useAsyncQueryExecutor} when consumers should consistently receive a Promise.
 *
 * @group Queries
 *
 * @returns A query executor function.
 *
 * @example
 * ```tsx
 * const query: QueryExecutor = useQueryExecutor();
 * const result: UserProfile = query(GET_USER_PROFILE, { id: 123 });
 * ```
 */
export function useQueryExecutor(): QueryExecutor {
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
  ) as QueryExecutor;
}
