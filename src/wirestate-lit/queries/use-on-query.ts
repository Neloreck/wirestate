import { ReactiveElement } from "@lit/reactive-element";
import { QueryHandler, QueryType } from "@wirestate/core";

import { OnQueryController } from "./on-query-controller";

/**
 * Describes options for {@link useOnQuery}.
 *
 * @group Queries
 */
export interface UseOnQueryOptions<D = unknown, R = unknown> {
  /**
   * The query type to handle.
   */
  type: QueryType;
  /**
   * The query handler function.
   */
  handler: QueryHandler<D, R>;
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
export function useOnQuery<D = unknown, R = unknown>(
  host: ReactiveElement,
  { type, handler }: UseOnQueryOptions<D, R>
): OnQueryController<D, R> {
  return new OnQueryController<D, R>(host, type, handler);
}
