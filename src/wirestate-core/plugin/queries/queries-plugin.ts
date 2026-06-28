import { MessagingPlugin } from "../messaging-plugin";

import { QUERY_REGISTRATION } from "./on-query";

/**
 * Enables query messaging on a container.
 *
 * @remarks
 * Register it (`new Container({ plugins: [new QueriesPlugin()] })`) to bind the
 * {@link QueryBus} and wire `@OnQuery` handlers at provision. Importing this class
 * is what pulls the query bus into the bundle.
 *
 * A child container can register its own `QueriesPlugin` for a local bus, or
 * omit it to use the nearest ancestor bus.
 *
 * @group Plugins
 *
 * @example
 * ```typescript
 * import { Container, QueriesPlugin, Injectable } from "@wirestate/core";
 *
 * @Injectable()
 * class CartService {}
 *
 * const container = new Container({ bindings: [CartService], plugins: [new QueriesPlugin()] });
 * ```
 */
export class QueriesPlugin extends MessagingPlugin {
  public constructor() {
    super(QUERY_REGISTRATION);
  }
}
