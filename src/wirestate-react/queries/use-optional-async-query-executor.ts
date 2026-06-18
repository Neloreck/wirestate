import { type Container, type QueryType, QueryBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type OptionalAsyncQueryExecutor } from "../types/queries";

/**
 * Returns a stable function to dispatch optional queries with Promise-normalized results.
 *
 * @remarks
 * The returned executor is memoized using `useMemo` and stays stable
 * for the lifetime of the container. It returns `undefined` instead of throwing
 * if no handler is registered and uses {@link QueryBus.queryOptionalAsync} internally.
 *
 * @group Queries
 *
 * @returns An optional async query executor function.
 *
 * @example
 * ```tsx
 * const queryOptionalAsync: OptionalAsyncQueryExecutor = useOptionalAsyncQueryExecutor();
 * const [settings, setSettings] = useState<UserSettings | undefined>(undefined);
 *
 * const refreshSettings = useCallback(async () => {
 *   setSettings(await queryOptionalAsync(GET_USER_SETTINGS, { id: 1 }));
 * }, [queryOptionalAsync]);
 * ```
 */
export function useOptionalAsyncQueryExecutor(): OptionalAsyncQueryExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, payload?: unknown) => {
      return bus.queryOptionalAsync(type, payload);
    }) as OptionalAsyncQueryExecutor;
  }, [container]);
}
