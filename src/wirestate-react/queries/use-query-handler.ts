import { Container, QueryBus, QueryHandler, QueryType } from "@wirestate/core";
import { useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Registers a query handler for the component's lifetime.
 *
 * @remarks
 * The handler is stored in a `useRef` and synced on every render to avoid stale
 * closures. Only one handler is active per type; newer registrations shadow older ones.
 * The handler is automatically unregistered when the component unmounts.
 *
 * @group Queries
 *
 * @template R - Result type of the query.
 * @template D - Data/payload type of the query.
 * @template T - Query identifier type.
 *
 * @param type - Query identifier (string or symbol).
 * @param handler - Function that responds to the query.
 *
 * @example
 * ```tsx
 * useQueryHandler("GET_DATA", (data) => {
 *   return { id: data.id, value: "Resolved" };
 * });
 * ```
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
