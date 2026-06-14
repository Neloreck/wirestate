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

`new Container({ bindings })` registers services and descriptors during container creation.

```ts
import { Container } from "@wirestate/core";
import { UserService } from "./UserService";

const container: Container = new Container({
  bindings: [UserService],
});

const users = container.get(UserService);
```

Use `container.bind` when you need to add a service to an existing container.

```ts
import { Container } from "@wirestate/core";

const container = new Container();

container.bind(UserService);
```

## Constructor Injection

Use `inject(token)` in constructor parameter defaults or field initializers. A token can be a class, string, symbol,
or `InjectionToken`. Pass `{ optional: true }` to resolve `undefined` instead of throwing when the token is not
bound. Because `inject()` is a plain function call, dependency declarations do not need parameter decorators or
`emitDecoratorMetadata`.

```ts
import { Injectable, inject } from "@wirestate/core";

@Injectable()
export class OrderService {
  public constructor(
    private readonly users: UserService = inject(UserService),
    private readonly logger: LoggerService = inject(LoggerService)
  ) {}
}
```

## Messaging

Messaging is composable and opt-in. A service injects the specific bus it needs, and the container binds that bus.
Inject [`EventBus`](/api/wirestate-core/classes/EventBus) to emit and subscribe to events,
[`CommandBus`](/api/wirestate-core/classes/CommandBus) to execute commands, and
[`QueryBus`](/api/wirestate-core/classes/QueryBus) to run queries.

```ts
import { EventBus, Injectable, inject } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(private readonly events: EventBus = inject(EventBus)) {}

  public checkout(): void {
    this.events.emit("CHECKOUT_STARTED");
  }
}
```

Bind each bus explicitly alongside the services that use it. There is no default trio.

```ts
import { Container, EventBus } from "@wirestate/core";

const container: Container = new Container({
  bindings: [CartService, EventBus],
});
```

A child container that wants the parent's bus simply does not bind its own. Buses resolve up the parent chain, so a
child service can reach an ancestor's bus.

To handle messages, declare primary handlers with [`@OnEvent`](/api/wirestate-core/functions/OnEvent),
[`@OnCommand`](/api/wirestate-core/functions/OnCommand), and [`@OnQuery`](/api/wirestate-core/functions/OnQuery) on
service methods. They are auto-wired during container provision and torn down during deprovision.

```ts
import { EventBus, Injectable, OnEvent, WireEvent } from "@wirestate/core";

@Injectable()
export class AnalyticsService {
  @OnEvent("CHECKOUT_STARTED")
  public onCheckoutStarted(event: WireEvent): void {
    // record the event
  }
}
```

Handler subscriptions are provision-scoped: they go live at provision and are removed at deprovision, not at
activation. A UI provider provisions the container automatically; in plain-core usage or tests, call
`container.provision()` (and `container.deprovision()`). See [Core Lifecycle](/core/lifecycle) for the messaging
window.

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

Use `WireStatus.for(this)` when async work needs a lifecycle guard.

```ts
import { Injectable, OnProvision, ProvisionId, WireStatus } from "@wirestate/core";

@Injectable()
export class ProfileService {
  @OnProvision()
  public async onProvision(provisionId: ProvisionId): Promise<void> {
    const profile = await fetch("/api/profile").then((response) => response.json());
    const status = WireStatus.for(this);

    if (status.isInactive || status.provisionId !== provisionId) {
      return;
    }

    this.setProfile(profile);
  }

  private setProfile(profile: unknown): void {
    // update service state
  }
}
```

## Lazy Resolution

Inject [`Container`](/api/wirestate-core/classes/Container) and call `container.get(Token)` when the dependency is
only needed later. Pass `{ optional: true }` to resolve `undefined` instead of throwing when the token is not bound.

```ts
import { Container, Injectable, inject } from "@wirestate/core";

@Injectable()
export class NotificationService {
  public constructor(private readonly container: Container = inject(Container)) {}

  public notify(message: string): void {
    const logger = this.container.get(LoggerService);

    logger.log(message);
  }
}
```

## Constants and Factories

Use descriptors when a binding needs an explicit token or binding strategy. This includes constants, factories, and
service classes registered behind a token that is different from the class itself.

```ts
import { BindingScope, BindingType, Container } from "@wirestate/core";

const API_URL = Symbol("API_URL");
const DATE_NOW = Symbol("DATE_NOW");
const container = new Container();

container.bind({ token: API_URL, value: "https://api.example.com" });
container.bind({
  token: DATE_NOW,
  type: BindingType.Factory,
  scope: BindingScope.Singleton,
  factory: () => new Date(),
});
```

## Remove Services

Use `container.unbind` when removing one binding. Use `container.unbindAll` when disposing the whole container.

```ts
container.unbind(UserService);
container.unbindAll();
```

The container deactivates removed services and keeps provider lifecycle state in sync. If a provider owns a service
when it is removed, `@OnDeprovision` runs before `@OnDeactivation`. After `unbindAll`, discard the container and
create a new one for future work.

## API Reference

[`Injectable`](/api/wirestate-core/functions/Injectable), [`inject`](/api/wirestate-core/functions/inject),
[`Container`](/api/wirestate-core/classes/Container), [`WireStatus`](/api/wirestate-core/classes/WireStatus),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision),
[`EventBus`](/api/wirestate-core/classes/EventBus), [`CommandBus`](/api/wirestate-core/classes/CommandBus),
[`QueryBus`](/api/wirestate-core/classes/QueryBus),
[`BindingDescriptor`](/api/wirestate-core/type-aliases/BindingDescriptor).
