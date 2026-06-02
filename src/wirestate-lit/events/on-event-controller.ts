import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { EventBus, EventHandler, EventType, EventUnsubscriber, WireEvent } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Optional } from "../types/general";

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
      this.unsubscriber = this.bus.subscribe(this.types, this.handler as EventHandler);
    }
  }

  private cleanup(): void {
    dbg.info(prefix(__filename), "Cleanup:", { types: this.types });

    this.unsubscriber?.();
    this.unsubscriber = null;
  }
}
