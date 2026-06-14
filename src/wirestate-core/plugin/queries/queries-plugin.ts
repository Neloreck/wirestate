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
 * @group Plugin
 *
 * @example
 * ```typescript
 * import { Container, QueriesPlugin } from "@wirestate/core";
 *
 * const container = new Container({ bindings: [CartService], plugins: [new QueriesPlugin()] });
 * ```
 */
export class QueriesPlugin extends MessagingPlugin {
  public constructor() {
    super(QUERY_REGISTRATION);
  }
}
