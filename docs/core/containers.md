# Core Containers

A [container](/api/wirestate-core/classes/Container) owns service instances, seed data, and one set of message buses.

Services in the same container share the same `EventBus`, `CommandBus`, and `QueryBus`. Child containers inherit parent
bindings, but keep their own buses and seed data.

## Root Container

```ts
import { Container, Injectable, createContainer } from "@wirestate/core";

@Injectable()
class UserService {}

@Injectable()
class AuthService {}

const container: Container = createContainer({
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
const container = createContainer({
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
import { Container, createContainer } from "@wirestate/core";

const child: Container = createContainer({
  parent: container,
  bindings: [CartService],
});
```

Child containers inherit parent bindings. Their buses and targeted seeds stay local to the child.

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs its own services or
local messaging.

## Inherited Messaging

Pass `{ skipMessaging: true }` as the second `createContainer` argument when a child should use the parent's message
buses instead of creating its own.

```ts
const child = createContainer(
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

`createContainer` returns a Wirestate `Container`. You can still use normal container methods when a lower-level
operation needs them.

```ts
if (container.isBound(UserService)) {
  const users = container.get(UserService);
}
```

Prefer Wirestate bindings and bind/unbind helpers for Wirestate services. They keep lifecycle, provider ownership, and
messaging metadata in sync.

## Removing Bindings

Use [`unbind`](/api/wirestate-core/functions/unbind) when removing one binding added through Wirestate. Use
[`unbindAll`](/api/wirestate-core/functions/unbindAll) when disposing a container completely.

```ts
import { unbind, unbindAll } from "@wirestate/core";

unbind(container, UserService);
unbindAll(child);
```

These wrappers call the container unbind operation and clean Wirestate-owned bookkeeping. If a provider owns the
service, `@OnDeprovision` runs before service deactivation. After `unbindAll`, discard the container.

Raw `container.unbind(...)` and `container.unbindAll()` remain available as low-level escape hatches, but they do not clean
Wirestate's registered binding list.

## API Reference

[`createContainer`](/api/wirestate-core/functions/createContainer), [`ContainerConfig`](/api/wirestate-core/interfaces/ContainerConfig),
[`CreateContainerOptions`](/api/wirestate-core/interfaces/CreateContainerOptions),
[`Container`](/api/wirestate-core/classes/Container), [`provisionContainer`](/api/wirestate-core/functions/provisionContainer),
[`deprovisionContainer`](/api/wirestate-core/functions/deprovisionContainer),
[`unbind`](/api/wirestate-core/functions/unbind), [`unbindAll`](/api/wirestate-core/functions/unbindAll).
