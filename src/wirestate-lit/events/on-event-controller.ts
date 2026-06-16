import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { EventBus, EventHandler, EventType, EventUnsubscribe, WireEvent } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { Nullable } from "../types/general";

/**
 * Reactive controller that subscribes to container events.
 *
 * @remarks
 * Registers on host connect. Unregisters on disconnect. Re-subscribes when the
 * nearest container changes.
 *
 * @group Events
 *
 * @example
 * ```typescript
 * import { LitElement } from "lit";
 * import { OnEventController } from "@wirestate/lit";
 *
 * class AuditLog extends LitElement {
 *   private readonly events = new OnEventController(this, ["USER_LOGIN"], (event) => {
 *     console.log(event.payload);
 *   });
 * }
 * ```
 */
export class OnEventController<E extends WireEvent = WireEvent> implements ReactiveController {
  private bus: Nullable<EventBus> = null;
  private unsubscriber: Nullable<EventUnsubscribe> = null;

  private readonly types: Nullable<ReadonlyArray<EventType>>;
  private readonly handler: EventHandler<E>;

  /**
   * @param host - The host element.
   * @param types - Event types to listen for. If null, all events will be handled.
   * @param handler - The event handler function.
   */
  public constructor(host: ReactiveElement, types: Nullable<ReadonlyArray<EventType>>, handler: EventHandler<E>) {
    host.addController(this);

    this.types = types;
    this.handler = handler;

    new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (container) => {
        this.cleanup();
        this.bus = container.get(EventBus);

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
      this.unsubscriber = this.bus.subscribe(this.types, this.handler as EventHandler);
    }
  }

  private cleanup(): void {
    this.unsubscriber?.();
    this.unsubscriber = null;
  }
}
