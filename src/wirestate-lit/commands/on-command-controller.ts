import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveElement } from "@lit/reactive-element";
import { CommandBus, CommandHandler, CommandType, CommandUnregister } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Nullable } from "../types/general";

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
 *   private readonly saveCommand = new OnCommandController(this, "SAVE", (payload: FormData) => {
 *     console.log("save", payload);
 *   });
 * }
 * ```
 */
export class OnCommandController<
  R = unknown,
  P = unknown,
  T extends CommandType = CommandType,
> implements ReactiveController {
  private bus: Nullable<CommandBus> = null;
  private unregister: Nullable<CommandUnregister> = null;

  private readonly type: T;
  private readonly handler: CommandHandler<R, P, T>;

  /**
   * @param host - The host element.
   * @param type - Command type to handle.
   * @param handler - The command handler function.
   */
  public constructor(host: ReactiveElement, type: T, handler: CommandHandler<R, P, T>) {
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
