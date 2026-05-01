import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { MaybePromise, Optional } from "@/wirestate/types/general";
import type { TOptionalQueryCaller, TQueryType } from "@/wirestate/types/queries";

/**
 * Returns a function to dispatch optional queries on the active container.
 * Returns null instead of throwing when no handler is registered.
 *
 * @returns optional query dispatcher
 */
export function useOptionalQueryCaller<
  R = unknown,
  D = unknown,
  T extends TQueryType = TQueryType,
>(): TOptionalQueryCaller<R, D, T> {
  const container: Container = useContainer();

  return useCallback(
    (type: T, data?: D): Optional<MaybePromise<R>> => {
      dbg.info(prefix(__filename), "Optional query data:", {
        type,
        data,
      });

      return container.get<QueryBus>(QUERY_BUS_TOKEN).queryOptional<R, D, T>(type, data);
    },
    [container]
  );
}
