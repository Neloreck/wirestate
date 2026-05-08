import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { OptionalQueryCaller, QUERY_BUS, QueryBus, QueryType } from "@/wirestate";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Returns a function to dispatch optional queries on the active container.
 * Returns null instead of throwing when no handler is registered.
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

      return container.get<QueryBus>(QUERY_BUS).queryOptional(type, data);
    },
    [container]
  ) as OptionalQueryCaller;
}
