# Core Lifecycle

Wirestate lifecycle has one service layer and one provider layer. Use this map to choose where service setup and cleanup
belong.

| Application                 | Wirestate                                                                              | Use it for                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Constructor resolution      | Service constructor and constructor dependencies.                                      | Assign injected dependencies and cheap field defaults. Avoid side effects that need cleanup.            |
| Container activation        | `@OnActivated` after the service instance is resolved.                                 | Read static seeds and do cheap setup that can run before a UI boundary is committed.                    |
| Provider mount/connect      | `@OnProvision` in binding order. Provider lifecycle participants are resolved first.   | Start provider-owned timers, subscriptions, sockets, observers, and async loops.                        |
| Provider unmount/disconnect | `@OnDeprovision` in reverse provision order, then the provider releases the container. | Stop every resource started in `@OnProvision`. Make cleanup complete and repeatable.                    |
| Container disposal          | `unbind` or `unbindAll`, then `@OnDeactivation` for resolved services.                 | Tear down service-level registrations and final service state. Discard the container after `unbindAll`. |

Managed providers activate all bindings by default unless `activate` is set, then dispose owned containers after
deprovision. External providers provision and deprovision the passed `container`, but disposal stays with the external
owner.

## Service Layer

Constructor resolution and activation belong to the container. A service can be resolved lazily through
`container.get(Token)` or `scope.resolve(Token)`. It can also be resolved eagerly when `createContainer({ activate })`
or a managed provider activates bindings.

`@OnActivated` runs during that first resolution. It is synchronous from the container's point of view: if the hook
returns a promise, Wirestate reports rejections through the container error handler but does not block resolution.

Use activation for work that does not depend on provider ownership, such as reading startup seed data or normalizing
in-memory state. Do not open cleanup-requiring resources there.

## Provider Layer

Provision and deprovision belong to the owner that exposes a container to an application boundary.

`@OnProvision` and `@OnDeprovision` are the right place for provider-owned resources. Wirestate resolves provider
lifecycle participants before calling provision hooks, calls provision hooks in binding order, and calls deprovision
hooks in reverse order.

Services that inject `WireScope` also participate in provider lifecycle state tracking. This lets async work check
`scope.isInactive` even when the service has no provider hook.

## Ownership

Managed providers own the container they create from `config`. They provision it while mounted or connected,
deprovision it when that boundary ends, and then dispose it with `unbindAll`.

External providers publish a container passed through `container`. They provision and deprovision it for their own
boundary, but they never dispose it. The code that created the external container remains responsible for `unbind` or
`unbindAll`.

Injected [`WireScope`](/api/wirestate-core/classes/WireScope) instances expose lifecycle state for late async guards:

| Field             | Meaning                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `isDisposed`      | `true` after service deactivation.                                                                                            |
| `isDeprovisioned` | `null` before provider provisioning reaches the service, `false` while provider-owned, and `true` after provider deprovision. |
| `isInactive`      | `true` when the service has been disposed or deprovisioned.                                                                   |

## API Reference

[`OnActivated`](/api/wirestate-core/functions/OnActivated),
[`OnDeactivation`](/api/wirestate-core/functions/OnDeactivation),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision),
[`provisionContainer`](/api/wirestate-core/functions/provisionContainer),
[`deprovisionContainer`](/api/wirestate-core/functions/deprovisionContainer),
[`unbind`](/api/wirestate-core/functions/unbind), [`unbindAll`](/api/wirestate-core/functions/unbindAll).
