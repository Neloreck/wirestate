import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TOptionalQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a function to dispatch optional queries on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional query dispatcher
 */
export function useOptionalQueryCaller(): TOptionalQueryCaller {
  const container: Container = useContainer();

  return useCallback(
    (type: TQueryType, data?: unknown) => {
      dbg.info(prefix(__filename), "Optional query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).queryOptional(type, data);
    },
    [container]
  ) as TOptionalQueryCaller;
}
