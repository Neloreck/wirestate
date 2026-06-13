import { Container, QueryBus, QueryHandler, QueryType } from "@wirestate/core";
import { useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

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
 * @template P - Payload type of the query.
 * @template T - Query type.
 *
 * @param type - Query type (string or symbol).
 * @param handler - Function that responds to the query.
 *
 * @example
 * ```tsx
 * useQueryHandler("GET_DATA", (payload) => {
 *   return { id: payload.id, value: "Resolved" };
 * });
 * ```
 */
export function useQueryHandler<R = unknown, P = unknown, T extends QueryType = QueryType>(
  type: T,
  handler: QueryHandler<R, P, T>
): void {
  const container: Container = useContainer();
  const handlerRef = useRef<QueryHandler<R, P, T>>(handler);

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(QueryBus).register<R, P, T>(type, (payload) => handlerRef.current(payload));
  }, [container, type]);
}
