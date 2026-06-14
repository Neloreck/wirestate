# Core Containers

A [container](/api/wirestate-core/classes/Container) owns service instances and the message buses it binds.

Messaging is opt-in: bind only the buses a container uses, as ordinary `bindings`. Services in the same container share
the buses bound there. A child container that binds no buses resolves `EventBus`, `CommandBus`, and `QueryBus` from its
parent chain.

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

Child containers inherit parent bindings. A child that binds its own buses keeps messaging local; a child that binds none
shares the parent's buses (see [Inherited Messaging](#inherited-messaging)).

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs its own services or
local messaging.

## Inherited Messaging

A child shares the parent's message buses simply by not binding its own. Omit the bus tokens from the child's `bindings`
and they resolve from the parent.

```ts
const child = new Container({
  parent: container,
  bindings: [CartService],
});
```

Because the child binds no buses, `EventBus`, `CommandBus`, and `QueryBus` resolve from the parent, and sending walks up
the parent chain. Use this when the child should share event, command, and query handlers with the parent. To give the
child its own messaging instead, bind the buses on the child.

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

The container deactivates removed services. If a provider owns the service, `@OnDeprovision` runs before service
deactivation. After `unbindAll`, discard the container.

## API Reference

[`Container`](/api/wirestate-core/classes/Container),
[`ContainerConfig`](/api/wirestate-core/interfaces/ContainerConfig).
