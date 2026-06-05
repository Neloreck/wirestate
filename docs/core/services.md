# Core Services

A service is an `@Injectable` class bound to a container. Put state ownership, workflows, IO coordination, and business
logic there.

## Declare a Service

```ts
import { Injectable } from "@wirestate/core";

@Injectable()
export class UserService {
  public currentUser: User | null = null;

  public setUser(user: User): void {
    this.currentUser = user;
  }
}
```

## Bind Services

`createContainer({ bindings })` registers services and descriptors during container creation.

```ts
import { Container, createContainer } from "@wirestate/core";
import { UserService } from "./UserService";

const container: Container = createContainer({
  bindings: [UserService],
});

const users = container.get(UserService);
```

Use `bind` when you need to add a service to an existing container.

```ts
import { bind, createContainer } from "@wirestate/core";

const container = createContainer();

bind(container, UserService);
```

## Constructor Injection

Use `@Inject(Token)` for constructor dependencies. A token can be a class, string, or symbol.

```ts
import { Inject, Injectable } from "@wirestate/core";

@Injectable()
export class OrderService {
  public constructor(
    @Inject(UserService)
    private readonly users: UserService,
    @Inject(LoggerService)
    private readonly logger: LoggerService
  ) {}
}
```

## WireScope

Inject [`WireScope`](/api/wirestate-core/classes/WireScope) when a service needs lazy resolution, events, commands,
queries, or seeds from its container.

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public checkout(): void {
    this.scope.emitEvent("CHECKOUT_STARTED");
  }
}
```

`WireScope` is transient. Each service gets its own scope handle.

`WireScope` depends on the container's `EventBus`, `QueryBus`, and `CommandBus`. Containers created with
`createContainer(config, { skipMessaging: true })` can only resolve `WireScope` when those buses are inherited from a
parent container. Without inherited messaging, use direct container injection instead of `WireScope`.

- `scope.isDisposed` becomes `true` after service deactivation.
- `scope.isDeprovisioned` tracks provider ownership: `null`, then `false`, then `true`.
- `scope.isInactive` is the normal guard for async work that may finish late.

## Lifecycle

Wirestate has service lifecycle and provider lifecycle:

- `@OnActivated` runs when the service is first resolved.
- `@OnDeactivation` runs when the service is unbound or the container is disposed.
- `@OnProvision` runs when a provider takes ownership of the container.
- `@OnDeprovision` runs before that provider releases or replaces the container.

Use provider lifecycle for work that needs cleanup: timers, subscriptions, sockets, observers, fetch loops, and external
handles. Keep activation cheap; it can run before a provider boundary is committed. See
[Core Lifecycle](/core/lifecycle) for the full map.

```ts
import { Injectable, OnDeprovision, OnProvision } from "@wirestate/core";

@Injectable()
export class PollingService {
  private timerId: ReturnType<typeof setInterval> | null = null;

  @OnProvision()
  public onProvision(): void {
    this.timerId = setInterval(() => this.poll(), 5_000);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private poll(): void {
    // fetch current data
  }
}
```

## Lazy Resolution

Use `scope.resolve(Token)` when the dependency is only needed later. `scope.resolveOptional(Token)` returns `null` when
the token is not bound.

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class NotificationService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public notify(message: string): void {
    const logger = this.scope.resolve(LoggerService);

    logger.log(message);
  }
}
```

## Constants and Factories

Use descriptors when a binding needs an explicit token or binding strategy. This includes constants, factories, and
service classes registered behind a token that is different from the class itself.

```ts
import { BindingScope, BindingType, bind, createContainer } from "@wirestate/core";

const API_URL = Symbol("API_URL");
const DATE_NOW = Symbol("DATE_NOW");
const container = createContainer();

bind(container, { token: API_URL, value: "https://api.example.com" });
bind(container, {
  token: DATE_NOW,
  type: BindingType.DynamicValue,
  scope: BindingScope.Singleton,
  factory: () => new Date(),
});
```

## Remove Services

Use `unbind` when removing one Wirestate binding. Use `unbindAll` when disposing the whole container.

```ts
import { unbind, unbindAll } from "@wirestate/core";

unbind(container, UserService);
unbindAll(container);
```

The wrappers keep Wirestate's registered binding list and provider lifecycle state in sync with Inversify. If a provider
owns a service when it is removed, `@OnDeprovision` runs before `@OnDeactivation`. After `unbindAll`, discard the
container and create a new one for future work.

## API Reference

[`Injectable`](/api/wirestate-core/functions/Injectable), [`Inject`](/api/wirestate-core/functions/Inject),
[`WireScope`](/api/wirestate-core/classes/WireScope), [`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision), [`BindingDescriptor`](/api/wirestate-core/type-aliases/BindingDescriptor),
[`unbind`](/api/wirestate-core/functions/unbind), [`unbindAll`](/api/wirestate-core/functions/unbindAll).
