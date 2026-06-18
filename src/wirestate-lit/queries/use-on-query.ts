import { type ReactiveElement } from "@lit/reactive-element";
import { type QueryHandler, type QueryType } from "@wirestate/core";

import { OnQueryController } from "./on-query-controller";

/**
 * Describes options for {@link useOnQuery}.
 *
 * @group Queries
 */
export interface UseOnQueryOptions<R = unknown, P = unknown, T extends QueryType = QueryType> {
  /**
   * The query type to handle.
   */
  type: T;
  /**
   * The query handler function.
   */
  handler: QueryHandler<R, P, T>;
}

/**
 * Registers a query handler for the host element's lifetime.
 *
 * @group Queries
 *
 * @param host - Host element.
 * @param options - Query handling options.
 * @param options.type - The query type to handle.
 * @param options.handler - The query handler function.
 * @returns Query controller.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private getUserController = useOnQuery(this, {
 *     type: "GET_USER",
 *     handler: (payload) => ({ name: "Alice" }),
 *   });
 * }
 * ```
 */
export function useOnQuery<R = unknown, P = unknown, T extends QueryType = QueryType>(
  host: ReactiveElement,
  { type, handler }: UseOnQueryOptions<R, P, T>
): OnQueryController<R, P, T> {
  return new OnQueryController<R, P, T>(host, type, handler);
}
