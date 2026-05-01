import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { Optional } from "@/wirestate/types/general";
import type { TOptionalSyncQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a stable function to dispatch synchronous optional queries.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional sync query dispatcher
 */
export function useOptionalSyncQueryCaller<
  R = unknown,
  D = unknown,
  T extends TQueryType = TQueryType,
>(): TOptionalSyncQueryCaller<R, D, T> {
  const container: Container = useContainer();

  return useCallback(
    (type: T, data?: D): Optional<R> => {
      dbg.info(prefix(__filename), "Optional sync query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).queryOptional<R, D, T>(type, data) as Optional<R>;
    },
    [container]
  );
}
