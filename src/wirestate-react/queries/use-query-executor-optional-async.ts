import { type Container, type QueryType, QueryBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type QueryExecutorOptionalAsync } from "../types/queries";

/**
 * Returns a stable function to dispatch optional queries with Promise-normalized results.
 *
 * @remarks
 * Always returns a Promise that resolves to the query result, or to `undefined`
 * when no handler is registered. The function is stable while the active
 * container is unchanged.
 *
 * @group Queries
 *
 * @returns An optional async query executor function.
 *
 * @example
 * ```tsx
 * const queryOptionalAsync: QueryExecutorOptionalAsync = useQueryExecutorOptionalAsync();
 * const [settings, setSettings] = useState<UserSettings | undefined>(undefined);
 *
 * const refreshSettings = useCallback(async () => {
 *   setSettings(await queryOptionalAsync(GET_USER_SETTINGS, { id: 1 }));
 * }, [queryOptionalAsync]);
 * ```
 */
export function useQueryExecutorOptionalAsync(): QueryExecutorOptionalAsync {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, payload?: unknown) => {
      return bus.queryOptionalAsync(type, payload);
    }) as QueryExecutorOptionalAsync;
  }, [container]);
}
