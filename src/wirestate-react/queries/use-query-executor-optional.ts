import { type Container, type QueryType, QueryBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type QueryExecutorOptional } from "../types/queries";

/**
 * Returns a stable function to dispatch optional synchronous queries on the active container.
 *
 * @remarks
 * Returns the query result, or `undefined` when no handler is registered instead
 * of throwing. The function is stable while the active container is unchanged.
 * Use {@link useQueryExecutorOptionalAsync} when the result should always be a Promise.
 *
 * @group Queries
 *
 * @returns An optional query executor function.
 *
 * @example
 * ```tsx
 * const queryOptional: QueryExecutorOptional = useQueryExecutorOptional();
 * const [settings, setSettings] = useState<UserSettings | undefined>(undefined);
 *
 * const refreshSettings = useCallback(() => {
 *   setSettings(queryOptional(GET_USER_SETTINGS, { id: 1 }));
 * }, [queryOptional]);
 * ```
 */
export function useQueryExecutorOptional(): QueryExecutorOptional {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, payload?: unknown) => {
      return bus.queryOptional(type, payload);
    }) as QueryExecutorOptional;
  }, [container]);
}
