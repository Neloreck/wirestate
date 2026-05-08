import { Container } from "inversify";
import { useEffect, useRef } from "react";

import { QUERY_BUS, QueryBus, QueryHandler, QueryType } from "@/wirestate";
import { useContainer } from "@/wirestate-react/provision/use-container";

/**
 * Registers a query handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @param type - query type
 * @param handler - query handler function
 */
export function useQueryHandler<R = unknown, D = unknown, T extends QueryType = QueryType>(
  type: T,
  handler: QueryHandler<D, R>
): void {
  const container: Container = useContainer();
  const handlerRef = useRef<QueryHandler<D, R>>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<QueryBus>(QUERY_BUS).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
