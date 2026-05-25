# Services

A service is an `@Injectable` class bound to a container. Put business logic there. Put UI rendering somewhere else.

Services can hold reactive state, plain state, or no state. Wirestate does not care.

## Declare A Service

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

## Bind A Service

`bindService` registers the class as a singleton and wires lifecycle and messaging decorators.

```ts
import { Container, bindService, createContainer } from "@wirestate/core";
import { UserService } from "./UserService";

const container: Container = createContainer();

bindService(container, UserService);

const users = container.get(UserService);
```

Most React and Lit code uses provider `entries` instead of calling `bindService` by hand.

```tsx
<ContainerProvider config={{ entries: [UserService] }}>
  <App />
</ContainerProvider>
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

Inject `WireScope` when a service needs the container edge: events, commands, queries, seeds, or lazy resolution.

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

`WireScope` is transient. Each service gets its own handle.

- `scope.isDisposed` becomes `true` after service deactivation.
- `scope.isDeprovisioned` tracks provider ownership: `null`, then `false`, then `true`.
- `scope.isInactive` is the normal guard for async work that may finish late.

```ts
@OnActivated()
public async onActivated(): Promise<void> {
  const data = await fetch("/api/data").then((r) => r.json());

  if (!this.scope.isInactive) {
    this.data.value = data;
  }
}
```

## Lifecycle

Service lifecycle follows the container.

- `@OnActivated` runs when the service is first resolved.
- `@OnDeactivation` runs when the service is unbound or the container is disposed.

```ts
import { Injectable, OnActivated, OnDeactivation } from "@wirestate/core";

@Injectable()
export class PollingService {
  private timerId: ReturnType<typeof setInterval> | null = null;

  @OnActivated()
  public onActivated(): void {
    this.timerId = setInterval(() => this.poll(), 5_000);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
```

Provider lifecycle follows React or Lit provider ownership.

- `@OnProvision` runs when a provider exposes the container to a subtree.
- `@OnDeprovision` runs before that provider removes or replaces it.

```ts
import { Injectable, OnDeprovision, OnProvision } from "@wirestate/core";
import { connectPanelChannel } from "./panel-channel";

@Injectable()
export class PanelService {
  private unsubscribe: (() => void) | null = null;

  @OnProvision()
  public onProvision(): void {
    this.unsubscribe = connectPanelChannel();
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
```

Provider hooks only run for entries registered through Wirestate helpers: `createContainer({ entries })`, React
`ContainerProvider` config, React `SubContainerProvider`, Lit providers, or direct `bindService` / `bindEntry`.

## Circular Dependencies

Avoid cycles when you can. If two services need each other immediately, the design is usually too tight.

Use `forwardRef` when a constructor cycle is unavoidable.

```ts
import { Inject, Injectable, forwardRef } from "@wirestate/core";

@Injectable()
export class ServiceA {
  public constructor(@Inject(forwardRef(() => ServiceB)) private readonly b: ServiceB) {}
}

@Injectable()
export class ServiceB {
  public constructor(@Inject(forwardRef(() => ServiceA)) private readonly a: ServiceA) {}
}
```

Use `scope.resolve(Token)` when the dependency is only needed later. That turns the startup handshake into a lazy lookup.

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

`scope.resolveOptional(Token)` returns `null` when the token is not bound.

## Constants And Factories

Use descriptors for non-class entries.

```ts
import { BindingType, bindConstant, bindDynamicValue, createContainer } from "@wirestate/core";

const API_URL = Symbol("API_URL");
const DATE_NOW = Symbol("DATE_NOW");
const container = createContainer();

bindConstant(container, { id: API_URL, value: "https://api.example.com" });
bindDynamicValue(container, {
  id: DATE_NOW,
  bindingType: BindingType.DynamicValue,
  factory: () => new Date(),
});
```

Inject descriptor tokens with `@Inject(API_URL)` or resolve them with `container.get(API_URL)`.
