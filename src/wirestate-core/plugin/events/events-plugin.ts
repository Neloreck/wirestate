import { MessagingPlugin } from "../messaging-plugin";

import { EVENT_REGISTRATION } from "./on-event";

/**
 * Enables event messaging on a container.
 *
 * @remarks
 * Register it (`new Container({ plugins: [new EventsPlugin()] })`) to bind the
 * {@link EventBus} and wire `@OnEvent` handlers at provision. Importing this class
 * is what pulls the event bus into the bundle.
 *
 * @group Plugin
 *
 * @example
 * ```typescript
 * import { Container, EventsPlugin } from "@wirestate/core";
 *
 * const container = new Container({ bindings: [CartService], plugins: [new EventsPlugin()] });
 * ```
 */
export class EventsPlugin extends MessagingPlugin {
  public constructor() {
    super(EVENT_REGISTRATION);
  }
}
