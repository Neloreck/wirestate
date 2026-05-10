import { Container, QueryBus, QueryHandler, QueryType } from "@wirestate/core";
import { useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Registers a query handler for the component's lifetime.
 * The handler is stored in a ref to avoid manual memoization.
 * Only one handler is active per type; newer registrations shadow older ones.
 *
 * @group queries
 *
 * @param type - Query type.
 * @param handler - Query handler function.
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
    return container.get(QueryBus).register<D, R>(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
