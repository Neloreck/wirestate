import { type QueryDispatchOptions, type Container, type QueryType, QueryBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";

import { type QueryExecutorAsync } from "./queries";

/**
 * Returns a stable function to dispatch queries with Promise-normalized results.
 *
 * @remarks
 * Always returns a Promise, whether the handler is synchronous or asynchronous,
 * so callers can `await` the result without checking. The function is stable
 * while the active container is unchanged. Pass `{ optional: true }` per dispatch
 * when a missing handler should resolve to `undefined`.
 *
 * @group Queries
 *
 * @returns An async query executor function.
 *
 * @example
 * ```tsx
 * const queryAsync: QueryExecutorAsync = useQueryExecutorAsync();
 * const [profile, setProfile] = useState<UserProfile | null>(null);
 *
 * const refreshProfile = useCallback(async () => {
 *   setProfile(await queryAsync(GET_USER_PROFILE, { id: 123 }));
 * }, [queryAsync]);
 * ```
 */
export function useQueryExecutorAsync(): QueryExecutorAsync {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, payload?: unknown, options?: QueryDispatchOptions) => {
      return bus.queryAsync(type, payload, options);
    }) as QueryExecutorAsync;
  }, [container]);
}
