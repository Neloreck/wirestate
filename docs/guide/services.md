# Services

A **Service** is an `@Injectable` class bound to an IoC container. It holds business logic, optionally reactive state,
and communicates with other services through injection or the messaging buses.

## Declaring a Service

Mark every class participating in the DI container with `@Injectable`.

```ts
import { Injectable } from "@wirestate/core";

@Injectable()
export class UserService {
  // ..

  public currentUser: User | null = null;

  // ..
}
```

## Binding a Service

`bindService` registers the class in singleton scope and wires up all lifecycle and messaging decorators.

```ts
import { Container, createIocContainer, bindService } from "@wirestate/core";
import { UserService } from "./UserService";

const container: Container = createIocContainer();

bindService(container, UserService);

const userService: UserService = container.get(UserService);
```

In React and Lit integration, `createInjectablesProvider` / `useInjectablesProvider` / `@injectablesProvide` call `bindService`
internally — you never call it manually in UI code.

## Constructor Injection

Inject dependencies by declaring typed constructor parameters with `@Inject`.

```ts
import { Injectable, Inject } from "@wirestate/core";

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

`WireScope` is a transient per-service bridge to the container's buses and seed data.
Inject it when a service needs to emit events, dispatch commands/queries, or read seed data.

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  // Emit event, execute command, or read seed from scope.
  public checkout(): void {
    this.scope.emitEvent("CHECKOUT_STARTED");
  }
}
```

`WireScope` is only valid between `@OnActivated` and `@OnDeactivation`. Accessing it outside this window throws `WirestateError`.

## Lifecycle

### @OnActivated

Runs after the service is resolved and bound. Use it to initialize reactive state from seeds, start subscriptions, or kick off async work.

```ts
import { Injectable, Inject, OnActivated, WireScope } from "@wirestate/core";

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

  // ...
}
```

### @OnDeactivation

Runs when the container disposes the service (e.g., when a React provider unmounts). Cancel timers, close connections, and flush state here.

```ts
import { OnDeactivation } from "@wirestate/core";

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

  // ...
}
```

### Disposing

`isDisposed` is a readonly boolean set to `true` after deactivation. Check it in async callbacks that outlive the service.

```ts
@Injectable()
export class DataService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  @OnActivated()
  public async onActivated(): Promise<void> {
    const data = await fetch("/api/data").then((r) => r.json());

    // On deactivation scopes are marked as disposed.
    // So if deactivation already happened, async code here is working in already destroyed data service.
    if (!this.scope.isDisposed) {
      this.data.value = data;
    }
  }

  // ...
}
```

## Circular Dependencies

Use `forwardRef` to break circular constructor dependencies.

```ts
import { Injectable, Inject, forwardRef } from "@wirestate/core";

@Injectable()
export class ServiceA {
  public constructor(
    @Inject(forwardRef(() => ServiceB))
    private readonly b: ServiceB
  ) {}
}

@Injectable()
export class ServiceB {
  constructor(
    @Inject(forwardRef(() => ServiceA))
    private readonly a: ServiceA
  ) {}
}
```

Prefer restructuring to removing cycles; `forwardRef` is a last resort.

## Lazy Resolution

Use `scope.resolve` instead of constructor injection to defer resolution and break cycles without `forwardRef`.

```ts
import { LoggerService } from "./LoggerService";

@Injectable()
export class NotificationService {
  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  public notify(msg: string): void {
    // Resolved during the call, not on construction:
    const logger: LoggerService = this.scope.resolve(LoggerService);

    logger.log(msg);
  }
}
```

`scope.resolveOptional(Token)` returns `null` if the token is not bound — safe for optional integrations.

## Binding Constants and Dynamic Values

```ts
import { bindConstant, bindDynamicValue } from "@wirestate/core";

const API_URL = Symbol("API_URL");

// Constant:
bindConstant(container, API_URL, "https://api.example.com");

// Factory:
bindDynamicValue(container, API_URL, () => process.env.API_URL ?? "");
```

Inject via `@Inject(API_URL)` in any service.
