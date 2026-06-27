import { MessagingPlugin } from "../messaging-plugin";

import { COMMAND_REGISTRATION } from "./on-command";

/**
 * Enables command messaging on a container.
 *
 * @remarks
 * Register it (`new Container({ plugins: [new CommandsPlugin()] })`) to bind the
 * {@link CommandBus} and wire `@OnCommand` handlers at provision. Importing this
 * class is what pulls the command bus into the bundle.
 *
 * A child container can register its own `CommandsPlugin` for a local bus, or
 * omit it to use the nearest ancestor bus.
 *
 * @group Plugins
 *
 * @example
 * ```typescript
 * import { CommandsPlugin, Container } from "@wirestate/core";
 *
 * const container = new Container({ bindings: [CartService], plugins: [new CommandsPlugin()] });
 * ```
 */
export class CommandsPlugin extends MessagingPlugin {
  public constructor() {
    super(COMMAND_REGISTRATION);
  }
}
