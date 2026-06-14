# Core Lifecycle

Wirestate lifecycle has one service layer and one provider layer. Use this map to choose where service setup and cleanup
belong.

| Application                 | Wirestate                                                                                  | Use it for                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Constructor resolution      | Service constructor and constructor dependencies.                                          | Assign injected dependencies and cheap field defaults. Avoid side effects that need cleanup.            |
| Container activation        | `@OnActivated` after the service instance is resolved.                                     | Do cheap setup that can run before a UI boundary is committed.                                          |
| Provider mount/connect      | `@OnProvision` in binding order. Provider lifecycle participants are resolved first.       | Start provider-owned timers, subscriptions, sockets, observers, and async loops.                        |
| Provider unmount/disconnect | `@OnDeprovision` in reverse provision order, then the provider releases the container.     | Stop every resource started in `@OnProvision`. Make cleanup complete and repeatable.                    |
| Container disposal          | `container.unbind` or `container.unbindAll`, then `@OnDeactivation` for resolved services. | Tear down service-level registrations and final service state. Discard the container after `unbindAll`. |

Managed providers activate all bindings by default unless `activate` is set, then dispose owned containers after
deprovision. External providers provision and deprovision the passed `container`, but disposal stays with the external
owner.

## Service Layer

Constructor resolution and activation belong to the container. A service can be resolved lazily through
`container.get(Token)`. It can also be resolved eagerly when `new Container({ activate })` or a managed provider
activates bindings.

`@OnActivated` runs during that first resolution. It is synchronous from the container's point of view: if the hook
returns a promise, Wirestate reports rejections through the container error handler but does not block resolution.

Use activation for work that does not depend on provider ownership, such as normalizing
in-memory state. Do not open cleanup-requiring resources there. `@OnActivated` runs before provision, so it is
outside the messaging window and cannot emit, execute, or query.

## Provider Layer

Provision and deprovision belong to the owner that exposes a container to an application boundary.

`@OnProvision` and `@OnDeprovision` are the right place for provider-owned resources. Wirestate resolves provider
lifecycle participants before calling provision hooks, calls provision hooks in binding order, and calls deprovision
hooks in reverse order.

Message handlers are also wired here. `@OnEvent`, `@OnCommand`, and `@OnQuery` subscribe at provision and unsubscribe
at deprovision, so the messaging window is `@OnProvision` through `@OnDeprovision`. Provision force-activates every
service that declares a handler, and a handler's bus resolves up the parent chain, so a child service can handle an
ancestor's bus. Because subscriptions are provision-scoped, messaging requires the container to be provisioned: a UI
provider does this automatically, while plain-core usage and tests call `container.provision()` (and
`container.deprovision()`).
`@OnActivated` runs before provision and `@OnDeactivation` runs after deprovision, so neither can emit, execute, or
query; put setup and teardown messaging in `@OnProvision` and `@OnDeprovision`.

Wirestate tracks lifecycle state for each resolved service instance. Use `WireStatus.for(this)` inside a service when
async work needs to know whether the instance is still active.

## Ownership

Managed providers own the container they create from `config`. They provision it while mounted or connected,
deprovision it when that boundary ends, and then dispose it with `container.unbindAll()`.

External providers publish a container passed through `container`. They provision and deprovision it for their own
boundary, but they never dispose it. The code that created the external container remains responsible for
`container.unbind` or `container.unbindAll`.

[`WireStatus`](/api/wirestate-core/classes/WireStatus) exposes lifecycle state for late async guards:

| Field             | Meaning                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `isDeactivated`   | `true` after service deactivation.                                                                                            |
| `isDeprovisioned` | `null` before provider provisioning reaches the service, `false` while provider-owned, and `true` after provider deprovision. |
| `isInactive`      | `true` when the service has been disposed or deprovisioned.                                                                   |
| `provisionId`     | Current provider provision cycle ID, or `null` before provider lifecycle reaches the service.                                 |

```ts
import { Injectable, OnProvision, ProvisionId, WireStatus } from "@wirestate/core";

@Injectable()
export class SearchService {
  @OnProvision()
  public async onProvision(provisionId: ProvisionId): Promise<void> {
    const result = await fetch("/api/search").then((response) => response.json());
    const status = WireStatus.for(this);

    if (status.isInactive || status.provisionId !== provisionId) {
      return;
    }

    this.applyResult(result);
  }

  private applyResult(result: unknown): void {
    // update service state
  }
}
```

## API Reference

[`OnActivated`](/api/wirestate-core/functions/OnActivated),
[`OnDeactivation`](/api/wirestate-core/functions/OnDeactivation),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision),
[`WireStatus`](/api/wirestate-core/classes/WireStatus),
[`ProvisionId`](/api/wirestate-core/type-aliases/ProvisionId),
[`Container`](/api/wirestate-core/classes/Container).
