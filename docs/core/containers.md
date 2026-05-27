# Core Containers

A [container](/api/wirestate/classes/Container) owns service instances, seed data, and one set of message buses.

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
  seed: { apiUrl: "https://api.example.com" },
  entries: [UserService, AuthService],
  activate: [AuthService],
});
```

`activate` controls eager resolution.

- `true` resolves every entry.
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
  entries: [CartService],
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

Prefer entries and bind helpers for Wirestate services so lifecycle and messaging metadata are registered consistently.

## API Reference

[`createContainer`](/api/wirestate/functions/createContainer), [`ContainerConfig`](/api/wirestate/type-aliases/ContainerConfig),
[`Container`](/api/wirestate/classes/Container), [`provisionContainer`](/api/wirestate/functions/provisionContainer),
[`deprovisionContainer`](/api/wirestate/functions/deprovisionContainer).
