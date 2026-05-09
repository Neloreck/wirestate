import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { Event, EventBus, EventHandler, EventType, EventUnsubscriber } from "@wirestate/core";

import { ContainerContext } from "../context/ioc-context";
import { Optional } from "../types/general";

export class OnEventController<E extends Event = Event> implements ReactiveController {
  private eventBus: Optional<EventBus> = null;
  private unsubscriber: Optional<EventUnsubscriber> = null;

  private readonly types: Optional<ReadonlyArray<EventType>>;
  private readonly handler: EventHandler<E>;

  public constructor(host: ReactiveElement, types: Optional<ReadonlyArray<EventType>>, handler: EventHandler<E>) {
    host.addController(this);

    this.types = types;
    this.handler = handler;

    new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        this.eventBus = context.container.get(EventBus);

        if (host.isConnected) {
          this.resubscribe();
        }
      },
    });
  }

  private resubscribe(): void {
    this.cleanup();

    if (this.eventBus) {
      if (this.types === null) {
        this.unsubscriber = this.eventBus.subscribe(this.handler as EventHandler);
      } else {
        this.unsubscriber = this.eventBus.subscribe((event) => {
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

  public hostConnected(): void {
    this.resubscribe();
  }

  public hostDisconnected(): void {
    this.cleanup();
  }
}
