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
export function useQueryHandler<RetType = unknown, D = unknown>(
  type: TQueryType,
  handler: TQueryHandler<D, RetType>
): void {
  const container: Container = useContainer();
  const handlerRef = useRef<TQueryHandler<D, RetType>>(handler);

  // Sync ref with the latest closure on every render.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const bus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    // Register on mount, unregister on unmount or type change.
    return bus.register<D, RetType>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
