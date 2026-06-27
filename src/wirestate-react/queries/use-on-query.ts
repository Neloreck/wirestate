import { type Container, type QueryHandler, type QueryType, QueryBus } from "@wirestate/core";
import { useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Registers a query handler for the component's lifetime.
 *
 * @remarks
 * Only one handler is active per type. The newest registration shadows older
 * ones. The handler is unregistered when the component unmounts or the active
 * container changes, and may change between renders without re-registering.
 *
 * @group Queries
 *
 * @template R - Result type of the query.
 * @template P - Payload type of the query.
 * @template T - Query type.
 *
 * @param type - Query type to handle.
 * @param handler - Function that resolves the query and returns its result.
 *
 * @example
 * ```tsx
 * useOnQuery("GET_DATA", (payload) => {
 *   return { id: payload.id, value: "Resolved" };
 * });
 * ```
 */
export function useOnQuery<R = unknown, P = unknown, T extends QueryType = QueryType>(
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
