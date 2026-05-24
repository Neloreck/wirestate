import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { OptionalAsyncQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch optional async-capable queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It returns `null` instead of throwing
 * if no handler is registered and uses {@link QueryBus.queryOptionalAsync} internally.
 *
 * @group Queries
 *
 * @returns An optional async query dispatcher function.
 *
 * @example
 * ```tsx
 * const queryOptionalAsync: OptionalAsyncQueryCaller = useOptionalAsyncQueryCaller();
 * const settings: UserSettings | null = await queryOptionalAsync(GET_USER_SETTINGS, { id: 1 });
 * ```
 */
export function useOptionalAsyncQueryCaller(): OptionalAsyncQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: QueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional async query data:", {
        type,
        data,
      });

      return container.get(QueryBus).queryOptionalAsync(type, data);
    },
    [container]
  ) as OptionalAsyncQueryCaller;
}
