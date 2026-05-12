import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { CommandBus, CommandHandler, CommandType, CommandUnregister } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContextObject } from "../context/ioc-context";
import { Optional } from "../types/general";

/**
 * Controller that registers a command handler for the host element's lifetime.
 *
 * @remarks
 * The handler is registered when the host connects and unregistered when it disconnects.
 * It automatically re-registers if the IoC container is updated.
 *
 * @group Commands
 */
export class OnCommandController<D = unknown, R = unknown> implements ReactiveController {
  private bus: Optional<CommandBus> = null;
  private unregister: Optional<CommandUnregister> = null;

  private readonly type: CommandType;
  private readonly handler: CommandHandler<D, R>;

  /**
   * @param host - The host element.
   * @param type - Unique identifier of the command to handle.
   * @param handler - The command handler function.
   */
  public constructor(host: ReactiveElement, type: CommandType, handler: CommandHandler<D, R>) {
    dbg.info(prefix(__filename), "Constructing:", { host, type });

    host.addController(this);

    this.type = type;
    this.handler = handler;

    new ContextConsumer(host, {
      context: IocContextObject,
      subscribe: true,
      callback: (context) => {
        this.bus = context.container.get(CommandBus);

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
      dbg.info(prefix(__filename), "Registering command handler:", { type: this.type });
      this.unregister = this.bus.register(this.type, this.handler);
    }
  }

  private cleanup(): void {
    dbg.info(prefix(__filename), "Cleanup:", { type: this.type });

    this.unregister?.();
    this.unregister = null;
  }
}
