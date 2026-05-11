import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { Event, EventBus, EventHandler, EventType, EventUnsubscriber } from "@wirestate/core";

import { IocContextObject } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Controller that subscribes to events from the event bus.
 *
 * It automatically handles subscription and unsubscription based on the host element's lifecycle.
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
   * @param types - Event types to listen for, if null, all events will be handled.
   * @param handler - The event handler function.
   */
  public constructor(host: ReactiveElement, types: Optional<ReadonlyArray<EventType>>, handler: EventHandler<E>) {
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
    this.resubscribe();
  }

  public hostDisconnected(): void {
    this.cleanup();
  }

  private resubscribe(): void {
    this.cleanup();

    if (this.bus) {
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
    this.unsubscriber?.();
    this.unsubscriber = null;
  }
}
