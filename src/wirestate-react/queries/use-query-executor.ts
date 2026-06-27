import { type QueryDispatchOptions, type Container, type QueryType, QueryBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";

import { type QueryExecutor } from "./queries";

/**
 * Returns a stable function to dispatch synchronous queries on the active container.
 *
 * @remarks
 * Returns the query result synchronously and throws when no handler is
 * registered. The function is stable while the active container is unchanged, so
 * it is safe to use as an effect or callback dependency. Use
 * {@link useQueryExecutorAsync} when the result should always be a Promise.
 * Pass `{ optional: true }` per dispatch when a missing handler is valid.
 *
 * @group Queries
 *
 * @returns A query executor function.
 *
 * @example
 * ```tsx
 * const query: QueryExecutor = useQueryExecutor();
 * const [profile, setProfile] = useState<UserProfile | null>(null);
 *
 * useEffect(() => {
 *   setProfile(query(GET_USER_PROFILE, { id: 123 }));
 * }, [query]);
 * ```
 */
export function useQueryExecutor(): QueryExecutor {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: QueryBus = container.get(QueryBus);

    return ((type: QueryType, payload?: unknown, options?: QueryDispatchOptions) => {
      return bus.query(type, payload, options);
    }) as QueryExecutor;
  }, [container]);
}
