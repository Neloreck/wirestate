import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { QueryBus, QueryHandler, QueryType, QueryUnregister } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContextObject } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Reactive controller that registers a query handler on the {@link QueryBus} for the host element's lifetime.
 *
 * The handler is registered when the host connects and unregistered when it disconnects.
 * When the IoC context is updated (container revision change), the handler is re-registered automatically.
 *
 * @group Queries
 */
export class OnQueryController<D = unknown, R = unknown> implements ReactiveController {
  private bus: Optional<QueryBus> = null;
  private unregister: Optional<QueryUnregister> = null;

  private readonly type: QueryType;
  private readonly handler: QueryHandler<D, R>;

  /**
   * @param host - The host element.
   * @param type - The query type to handle.
   * @param handler - The query handler function.
   */
  public constructor(host: ReactiveElement, type: QueryType, handler: QueryHandler<D, R>) {
    host.addController(this);

    this.type = type;
    this.handler = handler;

    dbg.info(prefix(__filename), "Constructing:", { host, type });

    new ContextConsumer(host, {
      context: IocContextObject,
      subscribe: true,
      callback: (context) => {
        this.bus = context.container.get(QueryBus);

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
