# Core Containers

A [container](/api/wirestate-core/classes/Container) owns service instances, seed data, and one set of message buses.

Same container means same `EventBus`, `CommandBus`, and `QueryBus`. Child container means inherited bindings with
separate buses and local seed data.

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

Eager activation is still resolution-time work. Do not use it to start resources that need cleanup. Use provider
lifecycle for that boundary: `provisionContainer`/`deprovisionContainer` in core, or the provider lifecycle exposed by a
UI adapter.

## Child Containers

Pass `parent` to create a child container.

```ts
import { Container, createContainer } from "@wirestate/core";

const child: Container = createContainer({
  parent: container,
  bindings: [CartService],
});
```

Child containers inherit parent bindings. Their buses and targeted seeds stay local.

Use child containers for modal state, checkout flows, tenant scope, tests, or any branch that needs different services.

## Direct Container Work

`createContainer` returns an Inversify `Container`. You can still use normal container methods when the local model needs
them.

```ts
if (container.isBound(UserService)) {
  const users = container.get(UserService);
}
```

Prefer bindings and Wirestate's bind/unbind helpers for Wirestate services so lifecycle, provider ownership, and messaging
metadata stay registered consistently.

## Removing Bindings

Use [`unbind`](/api/wirestate-core/functions/unbind) or [`unbindAll`](/api/wirestate-core/functions/unbindAll) when
removing bindings that were added through Wirestate.

```ts
import { unbind, unbindAll } from "@wirestate/core";

unbind(container, UserService);
unbindAll(child);
```

These wrappers call the underlying Inversify unbind operation and also clean Wirestate-owned bookkeeping. If a provider
currently owns the service, `@OnDeprovision` runs before service deactivation.

Raw `container.unbind(...)` and `container.unbindAll()` remain available as Inversify escape hatches, but they do not clean
Wirestate's registered binding list.

## API Reference

[`createContainer`](/api/wirestate-core/functions/createContainer), [`ContainerConfig`](/api/wirestate-core/type-aliases/ContainerConfig),
[`Container`](/api/wirestate-core/classes/Container), [`provisionContainer`](/api/wirestate-core/functions/provisionContainer),
[`deprovisionContainer`](/api/wirestate-core/functions/deprovisionContainer),
[`unbind`](/api/wirestate-core/functions/unbind), [`unbindAll`](/api/wirestate-core/functions/unbindAll).
