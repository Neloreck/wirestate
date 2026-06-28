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

`@Injectable()` marks the class as a valid implementation for instance bindings. It does not register the class by
itself. Bind the class on a container before resolving it.

The marker belongs to the exact class that is decorated. A subclass of an injectable class must also be decorated when
you bind the subclass directly.

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

Wirestate rejects instance bindings whose implementation class is not decorated with `@Injectable()`.

## Constructor Injection

Use `inject(token)` in constructor parameter defaults or field initializers.

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

`inject()` resolves from the container that is currently constructing the service. It follows the same lookup rules as
`container.get()`, including parent containers.

Use `{ optional: true }` when a dependency is allowed to be missing.

```ts
@Injectable()
export class DebugPanelService {
  public constructor(private readonly logger = inject(LoggerService, { optional: true })) {}

  public open(): void {
    this.logger?.log("debug panel opened");
  }
}
```

Use `{ lazy: true }` when the dependency should be resolved later. The returned function closes over the constructing
container.

```ts
@Injectable()
export class NotificationService {
  public constructor(private readonly getLogger = inject(LoggerService, { lazy: true, optional: true })) {}

  public notify(message: string): void {
    this.getLogger()?.log(message);
  }
}
```

Calling required `inject()` outside an active injection context throws. Keep it in constructor defaults, field
initializers, or factory bindings.

## Service Tokens

A [`ServiceToken<T>`](/api/wirestate-core/type-aliases/ServiceToken) is anything Wirestate can use as a lookup key:
class constructor, abstract class token, string, symbol, or [`InjectionToken<T>`](#injection-tokens).

Class tokens and `InjectionToken<T>` carry the resolved value type:

```ts
const users = inject(UserService);
const config = inject(RUNTIME_CONFIG);
```

Plain strings and symbols work for interop and extension points, but they resolve as `unknown` unless you provide a type
argument at the call site.

## Injection Tokens

An `InjectionToken<T>` is a typed, reference-stable key for the container. Use it when the token should carry the
resolved value type: configuration values, browser APIs, external clients, interface-typed dependencies, or service
contracts that should be resolved through an explicit key.

Plain string and symbol tokens work too, but they resolve as `unknown` and usually require a cast. An
`InjectionToken<T>` resolves as `T`, so the type follows the binding and every `inject()` or `container.get()` call that
uses the token.

```ts
import { Container, InjectionToken, Injectable, inject } from "@wirestate/core";

interface RuntimeConfig {
  readonly apiUrl: string;
}

const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>("RUNTIME_CONFIG");

const container = new Container({
  bindings: [{ token: RUNTIME_CONFIG, value: { apiUrl: "https://api.example.com" } }],
});

@Injectable()
class ApiClient {
  public constructor(private readonly config = inject(RUNTIME_CONFIG)) {}

  public loadUsers(): Promise<Response> {
    return fetch(`${this.config.apiUrl}/users`);
  }
}
```

The constructor argument is a human-readable label used only in diagnostics. It does not identify the token. Each
`InjectionToken` is identified by reference, so two tokens never collide even with the same description, and it is
nominal at the type level. `InjectionToken<A>` is not assignable to `InjectionToken<B>`. Use plain strings or symbols
for interop or untyped extension points. Use `InjectionToken<T>` when the dependency is part of your typed application
contract.

## Messaging

Messaging is composable and opt-in. A service injects the specific bus it needs, and the container registers the
plugin that contributes that bus. Inject [`EventBus`](/api/wirestate-core/classes/EventBus) to emit and subscribe to
events, [`CommandBus`](/api/wirestate-core/classes/CommandBus) to execute commands, and
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

Register the matching plugin for each bus a container uses. The plugin's `install()` contributes the bus binding, so
the services resolve it normally.

```ts
import { Container, EventsPlugin } from "@wirestate/core";

const container: Container = new Container({
  bindings: [CartService],
  plugins: [new EventsPlugin()],
});
```

A child container that wants the parent's bus does not register its own plugin. Buses resolve up the parent
chain, so a child service can reach an ancestor's bus.

A service that declares an `@OnEvent`, `@OnCommand`, or `@OnQuery` handler throws at provision unless the matching
plugin is registered, so a missing bus fails fast on UI provision phase.

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

When async work in a provider hook needs to know whether the instance is still active, guard it with
`WireStatus.for(this)`. See [WireStatus](/core/lifecycle#wirestatus).

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

## Binding Descriptors

Use descriptors when a binding needs an explicit token or binding strategy. This includes constants, factories, and
service classes registered behind an explicit token. Reach for a typed [`InjectionToken`](#injection-tokens) when the
resolved value should keep its type.

### Value Bindings

Use a value binding for constants, configuration, already-created objects, environment data, or external objects that
Wirestate should resolve as-is. Values are always singletons and do not participate in service lifecycle or messaging.

```ts
import { Container, InjectionToken } from "@wirestate/core";

const API_URL = new InjectionToken<string>("API_URL");
const container = new Container();

container.bind({ token: API_URL, value: "https://api.example.com" });
```

A plain string or symbol works as a token too, but resolves as `unknown`.

### Factory Bindings

A factory binding creates the value lazily when its token is resolved. It receives the current container, and it also
runs inside the injection context, so it can read other bindings with either the container argument or `inject()`.
Factory bindings are singletons by default: the factory runs once and the result is cached. Use
`scope: BindingScope.Transient` when every resolution should call the factory again.

```ts
import { BindingType, Container, InjectionToken } from "@wirestate/core";

interface RuntimeConfig {
  readonly apiUrl: string;
}

class ApiClient {
  public constructor(private readonly config: RuntimeConfig) {}
}

const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>("RUNTIME_CONFIG");
const API_CLIENT = new InjectionToken<ApiClient>("API_CLIENT");

const container = new Container({
  bindings: [
    { token: RUNTIME_CONFIG, value: { apiUrl: "https://api.example.com" } },
    {
      token: API_CLIENT,
      type: BindingType.Factory,
      factory: (current) => new ApiClient(current.get(RUNTIME_CONFIG)),
    },
  ],
});
```

Factory results are ordinary resolved values, not container-owned service instances. If the returned object needs
Wirestate lifecycle decorators, messaging decorators, or deactivation cleanup, bind an `@Injectable()` class with an
instance descriptor instead.

### Instance Bindings

A bare service class is shorthand for an instance binding where the token and implementation are the same class. Use an
instance descriptor when callers should resolve a different token than the implementation constructor: a typed
`InjectionToken`, an abstract class, a base class, or a class token mapped to a subclass.

```ts
import { BindingType, Container, Injectable, InjectionToken } from "@wirestate/core";

interface Logger {
  log(message: string): void;
}

const LOGGER = new InjectionToken<Logger>("LOGGER");

@Injectable()
class ConsoleLogger implements Logger {
  public log(message: string): void {
    console.info(message);
  }
}

const container = new Container({
  bindings: [{ token: LOGGER, type: BindingType.Instance, value: ConsoleLogger }],
});

const logger = container.get(LOGGER);
```

The `value` constructor must be decorated with `@Injectable()` and must produce a value assignable to the token type.
Singleton instance bindings are cached, owned by the container, and participate in Wirestate lifecycle and messaging.
Use `scope: BindingScope.Transient` only for plain injectable classes without lifecycle or messaging decorators.

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
[`isInjectable`](/api/wirestate-core/functions/isInjectable),
[`InjectionToken`](/api/wirestate-core/classes/InjectionToken),
[`ServiceToken`](/api/wirestate-core/type-aliases/ServiceToken),
[`Newable`](/api/wirestate-core/type-aliases/Newable),
[`Container`](/api/wirestate-core/classes/Container), [`WireStatus`](/api/wirestate-core/classes/WireStatus),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision),
[`EventBus`](/api/wirestate-core/classes/EventBus), [`CommandBus`](/api/wirestate-core/classes/CommandBus),
[`QueryBus`](/api/wirestate-core/classes/QueryBus), [`EventsPlugin`](/api/wirestate-core/classes/EventsPlugin),
[`CommandsPlugin`](/api/wirestate-core/classes/CommandsPlugin),
[`QueriesPlugin`](/api/wirestate-core/classes/QueriesPlugin),
[`BindingDescriptor`](/api/wirestate-core/type-aliases/BindingDescriptor).
