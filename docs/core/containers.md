# Core Containers

A [container](/api/wirestate-core/classes/Container) owns service instances and the message buses its plugins
contribute.

Messaging is opt-in: register only the plugins for the buses a container uses, as ordinary `plugins`. Each plugin's
`install()` binds its bus, so services in the same container share the buses contributed there. A child container that
registers no messaging plugins resolves `EventBus`, `CommandBus`, and `QueryBus` from its parent chain.

## Root Container

```ts
import { Container, Injectable } from "@wirestate/core";

@Injectable()
class UserService {}

@Injectable()
class AuthService {}

const container: Container = new Container({
  activate: [AuthService],
  bindings: [UserService, AuthService],
});
```

`activate` controls eager resolution.

- `true` resolves every binding.
- `false` or omitted keeps services lazy.
- An array resolves only the listed tokens.

Eager activation only resolves services. Use provider lifecycle for resources that need cleanup. See
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
hook rejections.

## Child Containers

Pass `parent` to create a child container.

```ts
import { Container } from "@wirestate/core";

const child: Container = new Container({
  parent: container,
  bindings: [CartService],
});
```

Child containers inherit parent bindings. A child that registers its own messaging plugins keeps messaging local; a
child that registers none shares the parent's buses (see [Inherited Messaging](#inherited-messaging)).

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs its own services or
local messaging.

## Inherited Messaging

A child shares the parent's message buses simply by not registering its own plugins. Omit the messaging plugins from the
child's `plugins` and the buses resolve from the parent.

```ts
const child = new Container({
  parent: container,
  bindings: [CartService],
});
```

Because the child registers no messaging plugins, `EventBus`, `CommandBus`, and `QueryBus` resolve from the parent, and
sending walks up the parent chain. Use this when the child should share event, command, and query handlers with the
parent. To give the child its own messaging instead, register the plugins on the child.

## Construction-time Data

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
trades type safety for fewer tokens — reads are `unknown` and need a cast — so prefer typed `InjectionToken`s unless the
indirection earns its place.

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

`Container` is the registration and disposal API. Binding a service class through `container.bind` makes it available
for Wirestate lifecycle handling. `@OnActivated` and `WireStatus` are applied when the service is resolved; messaging
handlers are wired later when the container is provisioned.

```ts
container.bind(UserService);

if (container.has(UserService)) {
  const users = container.get(UserService);
}
```

## Removing Bindings

Use `container.unbind` when removing one binding. Use `container.unbindAll` when disposing a container completely.

```ts
container.unbind(UserService);
child.unbindAll();
```

The container deactivates removed services. If a provider owns the service, `@OnDeprovision` runs before service
deactivation. After `unbindAll`, discard the container.

## API Reference

[`Container`](/api/wirestate-core/classes/Container),
[`ContainerConfig`](/api/wirestate-core/interfaces/ContainerConfig).
