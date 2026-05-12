import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { Event, EventBus, EventHandler, EventType, EventUnsubscriber } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContextObject } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Controller that subscribes to events for the host element's lifetime.
 *
 * @remarks
 * The handler is registered when the host connects and unregistered when it disconnects.
 * It automatically re-subscribes if the IoC container is updated.
 *
 * @group Events
 */
export class OnEventController<E extends Event = Event> implements ReactiveController {
  private bus: Optional<EventBus> = null;
  private unsubscriber: Optional<EventUnsubscriber> = null;

  private readonly types: Optional<ReadonlyArray<EventType>>;
  private readonly handler: EventHandler<E>;

  /**
   * @param host - The host element.
   * @param types - Event types to listen for. If null, all events will be handled.
   * @param handler - The event handler function.
   */
  public constructor(host: ReactiveElement, types: Optional<ReadonlyArray<EventType>>, handler: EventHandler<E>) {
    dbg.info(prefix(__filename), "Constructing:", { host, types });

    host.addController(this);

    this.types = types;
    this.handler = handler;

    new ContextConsumer(host, {
      context: IocContextObject,
      subscribe: true,
      callback: (context) => {
        this.bus = context.container.get(EventBus);

        if (host.isConnected) {
          this.resubscribe();
        }
      },
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected:", { types: this.types });
    this.resubscribe();
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", { types: this.types });
    this.cleanup();
  }

  private resubscribe(): void {
    this.cleanup();

    if (this.bus) {
      dbg.info(prefix(__filename), "Registering events handler:", { types: this.types });

      if (this.types === null) {
        this.unsubscriber = this.bus.subscribe(this.handler as EventHandler);
      } else {
        this.unsubscriber = this.bus.subscribe((event) => {
          if ((this.types as ReadonlyArray<EventType>).includes(event.type)) {
            this.handler(event as E);
          }
        });
      }
    }
  }

  private cleanup(): void {
    dbg.info(prefix(__filename), "Cleanup:", { types: this.types });

    this.unsubscriber?.();
    this.unsubscriber = null;
  }
}
