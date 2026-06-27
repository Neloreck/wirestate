# Core Containers

A [container](/api/wirestate-core/classes/Container) is one Wirestate dependency injection scope. It owns its local
bindings, the singleton instances created from those bindings, provider lifecycle state, and any message buses installed
by plugins on that container.

Child containers inherit parent bindings. They can still register their own bindings, lifecycle participants, and
plugins for the part of the app they represent.

## Create a Container

Register service classes or binding descriptors with `bindings`.

```ts
import { Container, Injectable } from "@wirestate/core";

@Injectable()
class UserService {}

@Injectable()
class AuthService {}

const container: Container = new Container({
  bindings: [UserService, AuthService],
});
```

Services are lazy by default. A service is constructed when something resolves it with `container.get()` or `inject()`.

## Eager Activation

Use `activate` when a configured binding must be resolved during container construction.

```ts
const container: Container = new Container({
  activate: [AuthService],
  bindings: [UserService, AuthService],
});
```

`activate` accepts three forms:

- `true` resolves every entry in `bindings`.
- An array resolves only the listed tokens.
- `false` or omitted keeps services lazy.

Every token listed in an activation array must also be present in `bindings`. `validateContainerConfig()` and the
`Container` constructor throw when an activation token is missing.

Eager activation resolves services. Use provider lifecycle for resources that need provision and cleanup work. See
[Core Lifecycle](/core/lifecycle).

## Internal Errors

Pass `onError` to send isolated internal errors to application logging. Without it, Wirestate reports them with
`console.error`.

```ts
const container = new Container({
  bindings: [AuthService],
  onError: (descriptor) => {
    reportError(descriptor.error, {
      source: descriptor.source,
      name: descriptor.instanceName,
    });
  },
});
```

Wirestate uses this for failures it catches to keep the container running, such as event handler errors and lifecycle
hook rejections. Child containers inherit the nearest parent error handler when they do not define their own.

## Child Containers

Pass `parent` to create a child container.

```ts
const child: Container = new Container({
  parent: container,
  bindings: [CartService],
});
```

Child containers look in their own bindings first, then fall back to the parent chain. Bind the same token in a child
when that branch needs a local replacement for a parent service.

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs its own services or
local messaging.

## Messaging Plugins

Messaging is opt-in. Register only the plugins for the buses a container uses.

```ts
import { CommandsPlugin, Container, EventsPlugin, QueriesPlugin } from "@wirestate/core";

const container = new Container({
  bindings: [AuthService],
  plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
});
```

Each plugin installs its bus as a binding. Services in the same container share the buses installed there.

A child that registers no messaging plugins resolves `EventBus`, `CommandBus`, and `QueryBus` from its parent chain and
uses the same bus instances as the parent. Register the messaging plugins on the child when the child should keep
handlers local.

## Construction-Time Data

Pass configuration or server-hydrated state into a container as ordinary value bindings. Use an
[`InjectionToken<T>`](/core/services#injection-tokens) so the value keeps its type at every read site.

```ts
import { Container, InjectionToken, Injectable, inject } from "@wirestate/core";

const API_CONFIG = new InjectionToken<{ apiUrl: string; locale: string }>("API_CONFIG");

@Injectable()
class ApiClient {
  public constructor(private readonly config = inject(API_CONFIG)) {}
}

const container = new Container({
  bindings: [ApiClient, { token: API_CONFIG, value: { apiUrl: "https://api.example.com", locale: "en-US" } }],
});
```

`inject(API_CONFIG)` is typed, so reads need no cast. A child resolves a parent-bound token through the normal
resolution chain, so bind the data once on the root and every descendant injects the same value. Data is just a binding:
there is no separate construction step and no merge.

To avoid declaring a token per value, bind one `Map` keyed by service class and read it with `this.constructor`. This
trades type safety for fewer tokens, because reads are `unknown` and need a cast. Prefer typed `InjectionToken`s unless
the indirection earns its place.

```ts
const SEEDS = new InjectionToken<Map<Function, unknown>>("SEEDS");

@Injectable()
class CounterService {
  private readonly data = inject(SEEDS).get(this.constructor) as { count: number };
}

new Container({
  bindings: [CounterService, { token: SEEDS, value: new Map([[CounterService, { count: 10 }]]) }],
});
```

## Direct Container Work

`Container` is the registration and disposal API. Binding a service class through `container.bind()` makes it available
for Wirestate lifecycle handling.

```ts
container.bind(UserService);

if (container.has(UserService)) {
  const users = container.get(UserService);
}
```

Use `has()` to include parent containers in the check. Use `hasOwn()` when only local bindings matter.

`getOwnBindings()` returns this container's registered descriptors in registration order. It does not include parent
bindings.

`getActiveInstances()` returns singleton service instances constructed by this container. Value bindings, factory values,
and transient instances are not included.

## Provisioning

Framework providers call `container.provision()` and `container.deprovision()` for you. Use them directly only when you
manage a container outside a framework provider.

Provisioning resolves provider lifecycle participants, wires plugin handlers, and runs `@OnProvision` for the current
provision cycle. A container can have only one active provision cycle. Calling `provision()` again before
`deprovision()` throws.

Deprovisioning runs `@OnDeprovision` and plugin disposers. Calling `deprovision()` on a container that is not provisioned
is a no-op.

## Removing Bindings

Use `container.unbind()` when removing one binding. Use `container.unbindAll()` when disposing a container completely.

```ts
container.unbind(UserService);
child.unbindAll();
```

The container deactivates removed singleton services. If a provider owns the service, `@OnDeprovision` runs before
service deactivation. After `unbindAll()`, discard the container.

## API Reference

[`Container`](/api/wirestate-core/classes/Container),
[`ContainerConfig`](/api/wirestate-core/interfaces/ContainerConfig),
[`validateContainerConfig`](/api/wirestate-core/functions/validateContainerConfig).
