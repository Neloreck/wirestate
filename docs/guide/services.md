# Services

A **Service** is an `@Injectable` class bound to a container. It holds business logic, optional reactive state,
and communicates with other services through injection or the messaging buses.

## Declaring a Service

Mark every class participating in the DI container with `@Injectable`.

```ts
import { Injectable } from "@wirestate/core";

@Injectable()
export class UserService {
  public currentUser: User | null = null;

  public logCurrentUser(): void {
    console.log("Current user:", this.currentUser);
  }
}
```

## Binding a Service

`bindService` registers the class in singleton scope and wires up lifecycle and messaging decorators.

```ts
import { Container, bindService, createContainer } from "@wirestate/core";
import { UserService } from "./UserService";

const container: Container = createContainer();

bindService(container, UserService);

const userService: UserService = container.get(UserService);
```

In React and Lit integration, `SubContainerProvider`, `useSubContainerProvider`, and `@subContainerProvide`
bind service entries through `createContainer`, so you do not call `bindService` manually in UI code.

## Constructor Injection

Inject dependencies by declaring typed constructor parameters with `@Inject`.

```ts
import { Inject, Injectable } from "@wirestate/core";

@Injectable()
export class OrderService {
  public constructor(
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(LoggerService)
    private readonly loggerService: LoggerService
  ) {}
}
```

## WireScope

`WireScope` is a transient bridge to the container's buses and seed data.
Inject it when a service needs to emit events, dispatch commands or queries, or read seeds.

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  public checkout(): void {
    this.scope.emitEvent("CHECKOUT_STARTED");
  }
}
```

`WireScope` is only valid between `@OnActivated` and `@OnDeactivation`. Accessing it outside this window throws `WirestateError`.

## Lifecycle

Core lifecycle follows service activation and disposal. Provider lifecycle follows React or Lit provider attachment and
removal.

### @OnActivated

Runs after the service is resolved and bound. Use it to initialize reactive state from seeds, start subscriptions, or kick off async work.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";

export interface FeedSeed {
  feedId: string;
}

@Injectable()
export class FeedService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  @OnActivated()
  public async onActivated(): Promise<void> {
    const seed = this.scope.getSeed<FeedSeed>(FeedService);

    if (seed?.feedId) {
      await this.loadFeed(seed.feedId);
    }
  }
}
```

### @OnDeactivation

Runs when the container disposes the service. Cancel timers, close connections, and flush state here.

```ts
import { Injectable, OnActivated, OnDeactivation } from "@wirestate/core";

@Injectable()
export class PollingService {
  private timerId: number = 0;

  @OnActivated()
  public onActivated(): void {
    this.timerId = setInterval(() => this.poll(), 5_000);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = 0;
    }
  }
}
```

## Disposing

`scope.isDisposed` becomes `true` after deactivation. Check it in async callbacks that may outlive the service.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";

@Injectable()
export class DataService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  @OnActivated()
  public async onActivated(): Promise<void> {
    const data = await fetch("/api/data").then((r) => r.json());

    if (!this.scope.isDisposed) {
      this.data.value = data;
    }
  }
}
```

## Provider Lifecycle

React and Lit providers support `@OnProvision` and `@OnDeprovision` from `@wirestate/core`.
Use them for work tied to a provider being connected, committed, removed, or replaced, such as connecting UI-scoped
subscriptions that should follow a `ContainerProvider` or `SubContainerProvider`.

```ts
import { Injectable, OnDeprovision, OnProvision } from "@wirestate/core";

@Injectable()
export class PanelService {
  @OnProvision()
  public onProvision(): void {
    // provider committed
  }

  @OnDeprovision()
  public onDeprovision(): void {
    // provider removed or replaced
  }
}
```

Provider hooks run only for entries registered through Wirestate binding helpers, including entries passed to
`createContainer`, `ContainerProvider` `config`, or `SubContainerProvider`. Managed React and Lit containers run
`@OnDeprovision` before disposal; external containers run provider deprovision without being disposed by the provider.

## Circular Dependencies

Use `forwardRef` to break circular constructor dependencies.

```ts
import { Inject, Injectable, forwardRef } from "@wirestate/core";

@Injectable()
export class ServiceA {
  public constructor(
    @Inject(forwardRef(() => ServiceB))
    private readonly b: ServiceB
  ) {}
}

@Injectable()
export class ServiceB {
  public constructor(
    @Inject(forwardRef(() => ServiceA))
    private readonly a: ServiceA
  ) {}
}
```

Prefer restructuring to removing cycles. `forwardRef` is a last resort.

## Lazy Resolution

Use `scope.resolve` instead of constructor injection to defer resolution and break cycles without `forwardRef`.

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

import { LoggerService } from "./LoggerService";

@Injectable()
export class NotificationService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  public notify(msg: string): void {
    const logger: LoggerService = this.scope.resolve(LoggerService);

    logger.log(msg);
  }
}
```

`scope.resolveOptional(Token)` returns `null` if the token is not bound.

## Binding Constants and Dynamic Values

```ts
import { BindingType, bindConstant, bindDynamicValue } from "@wirestate/core";

const API_URL = Symbol("API_URL");
const CURRENT_TIME = Symbol("CURRENT_TIME");

bindConstant(container, { id: API_URL, value: "https://api.example.com" });
bindDynamicValue(container, {
  id: CURRENT_TIME,
  bindingType: BindingType.DynamicValue,
  factory: () => new Date(),
});
```

Inject tokens via `@Inject(API_URL)`.
