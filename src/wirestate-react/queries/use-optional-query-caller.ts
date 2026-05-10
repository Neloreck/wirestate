import { Container, QueryBus, QueryType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../provision/use-container";
import { OptionalQueryCaller } from "../types/queries";

/**
 * Returns a function to dispatch optional queries on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @group queries
 *
 * @returns optional query dispatcher
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
