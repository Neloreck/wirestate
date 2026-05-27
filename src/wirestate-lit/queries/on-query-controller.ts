import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { QueryBus, QueryHandler, QueryType, QueryUnregister } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Optional } from "../types/general";

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
export class OnQueryController<D = unknown, R = unknown> implements ReactiveController {
  private bus: Optional<QueryBus> = null;
  private unregister: Optional<QueryUnregister> = null;

  private readonly type: QueryType;
  private readonly handler: QueryHandler<D, R>;

  /**
   * @param host - The host element.
   * @param type - Unique identifier of the query to handle.
   * @param handler - The query handler function.
   */
  public constructor(host: ReactiveElement, type: QueryType, handler: QueryHandler<D, R>) {
    host.addController(this);

    this.type = type;
    this.handler = handler;

    dbg.info(prefix(__filename), "Constructing:", { host, type });

    new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (container) => {
        this.bus = container.get(QueryBus);

        if (host.isConnected) {
          this.reregister();
        }
      },
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected:", { type: this.type });
    this.reregister();
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", { type: this.type });
    this.cleanup();
  }

  private reregister(): void {
    this.cleanup();

    if (this.bus) {
      dbg.info(prefix(__filename), "Registering query handler:", { type: this.type });
      this.unregister = this.bus.register(this.type, this.handler);
    }
  }

  private cleanup(): void {
    this.unregister?.();
    this.unregister = null;
  }
}
