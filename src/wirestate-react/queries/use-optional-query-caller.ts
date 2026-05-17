import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { OptionalQueryCaller } from "../types/queries";

/**
 * Returns a stable function to dispatch optional queries on the active container.
 *
 * @remarks
 * The returned dispatcher is memoized using `useCallback` and stays stable
 * for the lifetime of the container. It returns `null` instead of throwing
 * if no handler is registered.
 *
 * @group Queries
 *
 * @returns An optional query dispatcher function.
 *
 * @example
 * ```tsx
 * const queryOptional: OptionalQueryCaller = useOptionalQueryCaller();
 * const settings: UserSettings | null = await queryOptional(GET_USER_SETTINGS, { id: 1 });
 * ```
 */
export function useOptionalQueryCaller(): OptionalQueryCaller {
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
  ) as OptionalQueryCaller;
}
