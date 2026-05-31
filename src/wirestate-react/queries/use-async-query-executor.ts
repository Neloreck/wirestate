import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AsyncQueryExecutor } from "../types/queries";

/**
 * Returns a stable function to dispatch async-capable queries on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useMemo` and stays stable
 * for the lifetime of the container. It uses {@link QueryBus.queryAsync} internally.
 *
 * @group Queries
 *
 * @returns An async query executor function.
 *
 * @example
 * ```tsx
 * const queryAsync: AsyncQueryExecutor = useAsyncQueryExecutor();
 * const [profile, setProfile] = useState<UserProfile | null>(null);
 *
 * const refreshProfile = useCallback(async () => {
 *   setProfile(await queryAsync(GET_USER_PROFILE, { id: 123 }));
 * }, [queryAsync]);
 * ```
 */
export function useAsyncQueryExecutor(): AsyncQueryExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Async query data:", {
        type,
        data,
      });

      return bus.queryAsync(type, data);
    }) as AsyncQueryExecutor;
  }, [container]);
}
