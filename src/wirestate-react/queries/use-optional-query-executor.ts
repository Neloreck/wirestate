import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { OptionalQueryExecutor } from "../types/queries";

/**
 * Returns a stable function to dispatch optional synchronous queries on the active container.
 *
 * @remarks
 * The returned executor is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It returns `null` instead of throwing
 * if no handler is registered. Use {@link useOptionalAsyncQueryExecutor} when
 * consumers should consistently receive a Promise.
 *
 * @group Queries
 *
 * @returns An optional query executor function.
 *
 * @example
 * ```tsx
 * const queryOptional: OptionalQueryExecutor = useOptionalQueryExecutor();
 * const [settings, setSettings] = useState<UserSettings | null>(null);
 *
 * const refreshSettings = useCallback(() => {
 *   setSettings(queryOptional(GET_USER_SETTINGS, { id: 1 }));
 * }, [queryOptional]);
 * ```
 */
export function useOptionalQueryExecutor(): OptionalQueryExecutor {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional query data:", {
        type,
        data,
      });

      return container.get(QueryBus).queryOptional(type, data);
    },
    [container]
  ) as OptionalQueryExecutor;
}
