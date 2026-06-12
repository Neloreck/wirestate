# Core Containers

A [container](/api/wirestate-core/classes/Container) owns service instances, seed data, and one set of message buses.

Services in the same container share the same `EventBus`, `CommandBus`, and `QueryBus`. Child containers inherit parent
bindings, but keep their own buses and seed data.

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
  seed: { apiUrl: "https://api.example.com" },
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

Child containers inherit parent bindings. Their buses and targeted seeds stay local to the child.

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs its own services or
local messaging.

## Inherited Messaging

Pass `{ skipMessaging: true }` as the second `Container` constructor argument when a child should use the parent's
message buses instead of creating its own.

```ts
const child = new Container(
  {
    parent: container,
    bindings: [CartService],
  },
  { skipMessaging: true }
);
```

With `skipMessaging`, `WireScope`, `EventBus`, `CommandBus`, and `QueryBus` resolve from the parent. Use this only when
the child should share event, command, and query handlers with the parent scope.

## Direct Container Work

`Container` is the registration and disposal API. Binding a service class through `container.bind` wires the full
Wirestate lifecycle: `@OnActivated`/`@OnDeactivation` hooks, `@OnEvent`/`@OnCommand`/`@OnQuery` handlers, and
`WireStatus` tracking.

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

The container deactivates removed services and runs registered unbind interceptors first. If a provider owns the
service, `@OnDeprovision` runs before service deactivation. After `unbindAll`, discard the container.

## API Reference

[`Container`](/api/wirestate-core/classes/Container),
[`ContainerConfig`](/api/wirestate-core/interfaces/ContainerConfig),
[`ContainerOptions`](/api/wirestate-core/interfaces/ContainerOptions),
[`provisionContainer`](/api/wirestate-core/functions/provisionContainer),
[`deprovisionContainer`](/api/wirestate-core/functions/deprovisionContainer).
