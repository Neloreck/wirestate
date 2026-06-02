import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { CommandBus, CommandHandler, CommandType, CommandUnregister } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Optional } from "../types/general";

/**
 * Reactive controller that registers a command handler.
 *
 * @remarks
 * Registers on host connect. Unregisters on disconnect. Re-registers when the
 * nearest container changes.
 *
 * @group Commands
 *
 * @example
 * ```typescript
 * import { LitElement } from "lit";
 * import { OnCommandController } from "@wirestate/lit";
 *
 * class SaveButton extends LitElement {
 *   private readonly saveCommand = new OnCommandController(this, "SAVE", (data: FormData) => {
 *     console.log("save", data);
 *   });
 * }
 * ```
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
      context: ContainerContext,
      subscribe: true,
      callback: (container) => {
        this.cleanup();
        this.bus = container.get(CommandBus);

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
