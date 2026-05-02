import { Container } from "inversify";
import { useEffect, useRef } from "react";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TQueryHandler, TQueryType } from "@/wirestate/types/queries";

/**
 * Registers a query handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - query type
 * @param handler - query handler function
 */
export function useQueryHandler<R = unknown, D = unknown, T extends TQueryType = TQueryType>(
  type: T,
  handler: TQueryHandler<D, R>
): void {
  const container: Container = useContainer();
  const handlerRef = useRef<TQueryHandler<D, R>>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<QueryBus>(QUERY_BUS_TOKEN).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
