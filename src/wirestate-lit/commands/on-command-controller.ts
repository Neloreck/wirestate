import { ContextConsumer } from "@lit/context";
import { type ReactiveController, type ReactiveElement } from "@lit/reactive-element";
import { type CommandHandler, type CommandType, type CommandUnregister, CommandBus } from "@wirestate/core";

import { ContainerContext } from "../container/container-context";
import { type Nullable } from "../types/general";

/**
 * Reactive controller that registers a command handler.
 *
 * @remarks
 * Registers on host connect. Unregisters on disconnect. Re-registers when the
 * nearest container context changes.
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
    this.reregister();
  }

  public hostDisconnected(): void {
    this.cleanup();
  }

  private reregister(): void {
    this.cleanup();

    if (this.bus) {
      this.unregister = this.bus.register(this.type, this.handler);
    }
  }

  private cleanup(): void {
    this.unregister?.();
    this.unregister = null;
  }
}
