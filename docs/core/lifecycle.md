# Core Lifecycle

Wirestate lifecycle has one service layer and one provider layer. Use this map to choose where service setup and cleanup
belong, and [Hook Order](#hook-order) for the order hooks run in.

| Application                 | Wirestate                                                                                  | Use it for                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Constructor resolution      | Service constructor and constructor dependencies.                                          | Assign injected dependencies and cheap field defaults. Avoid side effects that need cleanup.                       |
| Container activation        | `@OnActivation` after the service instance is resolved.                                    | Do cheap setup that can run before a UI boundary is committed.                                                     |
| Provider mount/connect      | `@OnProvision`. Provider lifecycle participants are resolved first.                        | Start provider-owned timers, subscriptions, sockets, observers, and async loops.                                   |
| Provider unmount/disconnect | `@OnDeprovision`, then the provider releases the container.                                | Stop every resource started in `@OnProvision`. Make cleanup complete and repeatable.                               |
| Container teardown          | `container.unbind`, `container.unbindAll`, or `container.destroy`, then `@OnDeactivation`. | Tear down service-level registrations and final service state. `unbindAll` resets; `destroy` closes the container. |

Managed providers activate all bindings by default unless `activate` is set, then tear down owned containers after
deprovision. External providers provision and deprovision the passed `container`, but teardown stays with the external
owner.

## Service Layer

Constructor resolution and activation belong to the container. A service can be resolved lazily through
`container.get(Token)`. It can also be resolved eagerly when `new Container({ activate })` or a managed provider
activates bindings.

`@OnActivation` runs during that first resolution. Synchronous failures are reported through the container error handler
and rethrown, so activation can roll back. If the hook returns a promise, Wirestate reports rejections through the
container error handler but does not block resolution.

Use activation for work that does not depend on provider ownership, such as normalizing in-memory state. Do not open
cleanup-requiring resources there. `@OnActivation` runs before provision, so provision-scoped `@OnEvent`, `@OnCommand`,
and `@OnQuery` handlers are not wired yet.

## Provider Layer

Provision and deprovision belong to the owner that exposes a container to an application boundary.

`@OnProvision` and `@OnDeprovision` are the right place for provider-owned resources. Wirestate resolves every provider
lifecycle participant before calling any provision hook, so a hook never runs against an unresolved service. See
[Hook Order](#hook-order) for the order the hooks run in.

Message handlers are also wired here. `@OnEvent`, `@OnCommand`, and `@OnQuery` subscribe at provision and unsubscribe
after `@OnDeprovision`, so the decorated-handler window is `@OnProvision` through `@OnDeprovision`. Provision
force-activates every service that declares a handler, and a handler's bus resolves up the parent chain, so a child
service can handle an ancestor's bus. Because subscriptions are provision-scoped, decorated messaging requires the
container to be provisioned: a UI provider does this automatically, while plain-core usage and tests call
`container.provision()` and `container.deprovision()`.

Put setup and teardown messaging in `@OnProvision` and `@OnDeprovision`. Buses remain live during `@OnDeprovision`, and
handlers are removed after deprovision hooks run.

While `@OnDeprovision` runs, calls to `deprovision()`, `unbind()`, `unbindAll()`, or `destroy()` on the same container are
no-ops. The operation that started deprovision continues after the callback, so `@OnDeactivation` cannot interrupt it.

## Hook Order

Every hook runs on one axis: the order the container constructed the instances. Setup runs in that order, teardown runs
in the exact reverse.

| Hook              | Order                  |
| ----------------- | ---------------------- |
| `@OnActivation`   | Creation order         |
| `@OnProvision`    | Creation order         |
| `@OnDeprovision`  | Reverse creation order |
| `@OnDeactivation` | Reverse creation order |

A dependency is constructed before the dependent that injected it. So a service can rely on its injected dependencies
having provisioned already, and can still use them while it deprovisions. The order the bindings were declared in does
not change that:

```ts
import { Container, Injectable, OnProvision, inject } from "@wirestate/core";

@Injectable()
class ApiService {
  @OnProvision()
  public onProvision(): void {
    this.connect();
  }
}

@Injectable()
class CartService {
  public constructor(private readonly api: ApiService = inject(ApiService)) {}

  @OnProvision()
  public onProvision(): void {
    this.api.load();
  }
}

// CartService is declared first, but constructing it constructs ApiService first. ApiService
// therefore provisions first and deprovisions last, and `this.api` is ready in both hooks.
new Container({ bindings: [CartService, ApiService] }).provision();
```

Services with no injection between them are constructed in the order their bindings were registered, so that is the
order they provision in. Constructing one earlier moves it earlier: an explicit `activate: [Token]` list, or a
`container.get(Token)` before `provision()`, both decide creation order for the services they touch.

The rule follows constructor injection. A dependency first reached through `inject(token, { lazy: true })`, through a
`container.get(token)` inside a hook, or from a parent container is not constructed as part of the dependent, so the two
are not ordered against each other. Resolve it in the constructor when the order matters.

Order applies within one container. `container.destroy()` does not cascade to child containers, so a hierarchy is torn
down by whoever owns each container: a framework provider when it created the container, your own code otherwise. Tear a
child down before its parent, so its services can still resolve upwards while they deprovision.

## Ownership

Managed providers own the container they create from `config`. They provision it while mounted or connected,
deprovision it when that boundary ends, and then tear it down with `container.destroy()`.

External providers publish a container passed through `container`. They provision and deprovision it for their own
boundary, but they never tear it down. The code that created the external container remains responsible for
`container.unbind`, `container.unbindAll`, or `container.destroy`.

## WireStatus

Wirestate tracks lifecycle state for each resolved service instance. Hold that status as a field with
`WireStatus.track(this)`, then guard anything that resumes after an `await` with `isStale()`. This stops a late result
from overwriting current state after the service was deprovisioned, deactivated, or provisioned again.

```ts
import { Injectable, OnProvision, ProvisionId, WireStatus } from "@wirestate/core";

@Injectable()
export class SearchService {
  public constructor(private readonly status: WireStatus = WireStatus.track(this)) {}

  @OnProvision()
  public async onProvision(provisionId: ProvisionId): Promise<void> {
    const result = await fetch("/api/search").then((response) => response.json());

    if (this.status.isStale(provisionId)) {
      return;
    }

    this.applyResult(result);
  }

  private applyResult(result: unknown): void {
    // update service state
  }
}
```

`isStale(provisionId)` is `true` when the instance has ended its lifecycle, or when a newer provision cycle has
superseded the one the work belongs to - for example a Strict Mode remount or a DOM move. Both halves matter: the
provision ID alone still matches after deprovision and after deactivation, so comparing IDs by hand lets a late result
through.

Methods outside the lifecycle hooks are not handed a provision ID. Snapshot the current one before the `await` and pass
it back to `isStale()`:

```ts
import { Injectable, WireStatus } from "@wirestate/core";

@Injectable()
export class PageService {
  public constructor(private readonly status: WireStatus = WireStatus.track(this)) {}

  public async loadPage(page: number): Promise<void> {
    const provisionId = this.status.provisionId;
    const result = await fetch(`/api/search?page=${page}`).then((response) => response.json());

    if (this.status.isStale(provisionId)) {
      return;
    }

    this.applyResult(result);
  }

  private applyResult(result: unknown): void {
    // update service state
  }
}
```

A snapshot taken before provider lifecycle reached the service is `null`, and stays current until a provision cycle
starts.

Get a status through either static on [`WireStatus`](/api/wirestate-core/classes/WireStatus):

| Static                       | Result                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `WireStatus.track(instance)` | Starts tracking and returns the instance's status. Idempotent, so a constructor call and activation share one status object. |
| `WireStatus.for(instance)`   | Returns the status of an already-tracked instance. Throws for anything Wirestate does not track.                             |

Instances are tracked from activation onward, so `for()` works in any lifecycle hook and in any method reachable from
one. A constructor runs before activation, which is why the field initializer above uses `track()`.

The status exposes:

| Member                 | Meaning                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `isStale(provisionId)` | `true` when the work belongs to an ended or superseded lifecycle.                                                             |
| `isDeactivated`        | `true` after service deactivation.                                                                                            |
| `isDeprovisioned`      | `null` before provider provisioning reaches the service, `false` while provider-owned, and `true` after provider deprovision. |
| `isInactive`           | `true` when the service has been deactivated or deprovisioned.                                                                |
| `provisionId`          | Current provider provision cycle ID, or `null` before provider lifecycle reaches the service.                                 |

A service that guards in exactly one place can skip the field and read the status inline with
`WireStatus.for(this).isStale(provisionId)`.

## API Reference

[`OnActivation`](/api/wirestate-core/functions/OnActivation),
[`OnDeactivation`](/api/wirestate-core/functions/OnDeactivation),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision),
[`WireStatus`](/api/wirestate-core/classes/WireStatus),
[`ProvisionId`](/api/wirestate-core/type-aliases/ProvisionId),
[`Container`](/api/wirestate-core/classes/Container).
