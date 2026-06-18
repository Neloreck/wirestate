import { ContextConsumer } from "@lit/context";
import { type ReactiveController, type ReactiveElement } from "@lit/reactive-element";
import { type QueryHandler, type QueryType, type QueryUnregister, QueryBus } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { type Nullable } from "../types/general";

/**
 * Reactive controller that registers a query handler.
 *
 * @remarks
 * Registers on host connect. Unregisters on disconnect. Re-registers when the
 * nearest container changes.
 *
 * @group Queries
 *
 * @example
 * ```typescript
 * import { LitElement } from "lit";
 * import { OnQueryController } from "@wirestate/lit";
 *
 * class CheckoutHost extends LitElement {
 *   private readonly querySummary = new OnQueryController(this, "CHECKOUT_SUMMARY", () => ({
 *     itemCount: 2,
 *     total: 48,
 *   }));
 * }
 * ```
 */
export class OnQueryController<
  R = unknown,
  P = unknown,
  T extends QueryType = QueryType,
> implements ReactiveController {
  private bus: Nullable<QueryBus> = null;
  private unregister: Nullable<QueryUnregister> = null;

  private readonly type: T;
  private readonly handler: QueryHandler<R, P, T>;

  /**
   * @param host - The host element.
   * @param type - Query type to handle.
   * @param handler - The query handler function.
   */
  public constructor(host: ReactiveElement, type: T, handler: QueryHandler<R, P, T>) {
    host.addController(this);

    this.type = type;
    this.handler = handler;

    new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (container) => {
        this.cleanup();
        this.bus = container.get(QueryBus);

        if (host.isConnected) {
          this.reregister();
        }
      },
    });
  }

  public hostConnected(): void {
    this.reregister();
  }

  public hostDisconnected(): void {
    this.cleanup();
  }

  private reregister(): void {
    this.cleanup();

    if (this.bus) {
      this.unregister = this.bus.register(this.type, this.handler);
    }
  }

  private cleanup(): void {
    this.unregister?.();
    this.unregister = null;
  }
}
