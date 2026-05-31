# @wirestate/core [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Core package for Wirestate.
Provides the DI container, service primitives, and event/command/query buses.
React integration is in [`@wirestate/react`](https://www.npmjs.com/package/@wirestate/react), and Lit integration is
in [`@wirestate/lit`](https://www.npmjs.com/package/@wirestate/lit).

## Installation

```bash
npm install @wirestate/core reflect-metadata
```

Import `reflect-metadata` once at your application entry point, before any Wirestate imports:

```ts
import "reflect-metadata";
```

## Services

Services are plain classes decorated with `@Injectable`. Each service may inject a `WireScope` which provides access to the event, command, and query buses and to other services in the container.

`@OnActivated` and `@OnDeactivation` methods are invoked during the synchronous Inversify lifecycle. If they return a
promise, Wirestate does not block container resolution or disposal. Keep activation cheap and avoid opening resources
there.
`@OnProvision` and `@OnDeprovision` methods are invoked by providers when a container is attached to or detached from an
owned boundary. Use them for timers, subscriptions, sockets, and async work that needs cleanup. Services that inject
`WireScope` also participate in provider deprovision state tracking, even when they do not declare provider lifecycle
hooks.

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count = 0;

  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public increment(): void {
    this.count++;
  }
}
```

## Container

```ts
import { bind, createContainer, unbind, unbindAll } from "@wirestate/core";

const container = createContainer({
  bindings: [CounterService],
  seed: { baseUrl: "https://example.com" },
});

bind(container, AnotherService);

const counterService = container.get(CounterService);
const anotherService = container.get(AnotherService);

unbind(container, AnotherService);
unbindAll(container);
```

`bind` accepts service classes and binding descriptors. Use `unbind` to remove one Wirestate binding, and use
`unbindAll` to dispose the container. They clean registered binding entries and deprovision provider-owned services
before Inversify deactivation. After `unbindAll`, discard the container and create a new one for future work.

## Events

Events are fire-and-forget messages. Any service can emit or subscribe.

```ts
import { OnEvent, WireScope, Inject } from "@wirestate/core";

@Injectable()
export class SenderService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public notify(): void {
    this.scope.emitEvent("USER_LOGGED_OUT");
  }
}

@Injectable()
export class ReceiverService {
  @OnEvent("USER_LOGGED_OUT")
  public onLogout(): void {
    // handle logout
  }
}
```

`@OnEvent()` with no argument subscribes to all events.

## Commands

Commands are write operations dispatched by token. A single handler is expected per command type.

```ts
import { OnCommand, WireScope, Inject } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGIN")
  public async onLogin(payload: { username: string }): Promise<void> {
    // perform login
  }
}

@Injectable()
export class AnotherService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public async login(): Promise<void> {
    await this.scope.executeCommandAsync("LOGIN");
  }
}
```

Use `executeCommand` / `CommandBus.execute` for synchronous command handlers. Use `executeCommandAsync` /
`CommandBus.executeAsync` when callers should consistently receive a Promise. Use optional variants when a handler may
not be registered; they return `null` instead of throwing.

## Queries

Queries are request-response operations. A single handler is expected per query type.

```ts
import { OnQuery, WireScope, Inject } from "@wirestate/core";

@Injectable()
export class StoreService {
  private items: Array<string> = [];

  @OnQuery("STORE_ITEMS")
  public onGetItems(): Array<string> {
    return this.items;
  }
}

@Injectable()
export class AnotherService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public async someActionRequiringItems(): Promise<void> {
    const syncItems: Array<string> = this.scope.query("STORE_ITEMS");
    const asyncItems: Array<string> = await this.scope.queryAsync("STORE_ITEMS");
  }
}
```

## Seeds

Seeds pass initial data to services when they are resolved or provisioned.

```ts
import { SEED, Injectable, Inject } from "@wirestate/core";

// Shared seed - same object injected into all services in the tree:
@Injectable()
export class MyService {
  public constructor(@Inject(SEED) private seed: { theme: string }) {}
}

// Per-service seed - each service gets its own seed value:
@Injectable()
export class OtherService {
  public constructor(@Inject(WireScope) scope: WireScope) {
    const { count } = scope.getSeed(OtherService) as { count: number };
  }
}
```

Seeds are set when the container is created. For managed containers, pass `seed` or `seeds` inside provider config. For
external containers, pass seeds to `createContainer`.

## Lifecycle

```ts
import { OnDeprovision, OnProvision } from "@wirestate/core";

@Injectable()
export class PollingService {
  private timer?: ReturnType<typeof setInterval>;
  private unsubscribe?: () => void;

  @OnProvision()
  public onProvision(): void {
    this.timer = setInterval(() => console.info("interval execution"), 5000);
    this.unsubscribe = connectToProviderScopedResource();
  }

  @OnDeprovision()
  public onDeprovision(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}
```

`@OnActivated` runs after the service is bound and all dependencies are resolved.
`@OnDeactivation` runs when a service is unbound or the container scope is disposed.
`@OnProvision` runs when a provider exposes the container to an owned boundary.
`@OnDeprovision` runs before that provider removes or replaces the container; external containers are not disposed by
the provider.

Do not start cleanup-requiring work in `@OnActivated`. Provider lifecycles are the ownership boundary for that work.
When removing bindings manually, prefer Wirestate's `unbind` and `unbindAll` helpers over raw `container.unbind(...)` so
the registered binding list and provider lifecycle state stay in sync. Treat `unbindAll` as container disposal and
discard the container afterward.

Injected `WireScope` instances expose lifecycle state for async guards:

- `scope.isDisposed` becomes `true` after service deactivation.
- `scope.isDeprovisioned` is `null` before provider provisioning reaches the service, `false` while it is provider-owned, and `true` after provider deprovision.
- `scope.isInactive` is `true` when either disposal or deprovision ended the service's usable lifecycle.

## WireScope API

`WireScope` is injected per-service and exposes:

| Member                                     | Description                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `isDisposed`                               | `true` after service deactivation                                                           |
| `isDeprovisioned`                          | `null` before provider provisioning, `false` while owned, `true` after provider deprovision |
| `isInactive`                               | `true` when `isDisposed` or `isDeprovisioned === true`                                      |
| `resolve(token)`                           | Resolve a service or value by token                                                         |
| `resolveOptional(token)`                   | Resolve a service or value, returns `null` if not bound                                     |
| `getSeed(token?)`                          | Get the per-service or shared seed                                                          |
| `emitEvent(type, payload?, options?)`      | Emit an event; pass `options.from` when the event should carry an explicit source           |
| `subscribeToEvent(handler)`                | Subscribe a handler to all events; returns unsubscribe function                             |
| `unsubscribeFromEvent(handler)`            | Remove a specific event subscription by handler reference                                   |
| `query(type, data?)`                       | Dispatch a synchronous query and return the result                                          |
| `queryAsync(type, data?)`                  | Dispatch a query and return the result as a promise                                         |
| `queryOptional(type, data?)`               | Dispatch a synchronous query; returns `null` if no handler is registered                    |
| `queryOptionalAsync(type, data?)`          | Dispatch a query as a promise; returns `null` if no handler is registered                   |
| `registerQueryHandler(type, handler)`      | Register a query handler; returns unregister function                                       |
| `unregisterQueryHandler(type, handler)`    | Remove a specific query handler by type and reference                                       |
| `executeCommand(type, data?)`              | Dispatch a command and return the result                                                    |
| `executeCommandAsync(type, data?)`         | Dispatch a command and return the result as a promise                                       |
| `executeOptionalCommand(type, data?)`      | Dispatch a command result; returns `null` if no handler is registered                       |
| `executeOptionalCommandAsync(type, data?)` | Dispatch a command as a promise; returns `null` if no handler is registered                 |
| `registerCommandHandler(type, handler)`    | Register a command handler; returns unregister function                                     |
| `unregisterCommandHandler(type, handler)`  | Remove a specific command handler by type and reference                                     |

## Testing containers

```ts
import { createContainer } from "@wirestate/core";
```

### `createContainer(config?, options?)`

Creates a configured IoC container for application code and tests. Use the first argument for reusable container config:

| Config     | Type                                  | Description                                                                             |
| ---------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| `activate` | `boolean \| Array<ServiceIdentifier>` | `true` to resolve all bindings, or specific tokens to resolve immediately after binding |
| `bindings` | `Array<Newable \| BindingDescriptor>` | Services or descriptors to bind                                                         |
| `onError`  | `WirestateInternalErrorHandler`       | Handles isolated internal errors; defaults to `console.error`                           |
| `parent`   | `Container`                           | Parent container for inherited bindings                                                 |
| `seed`     | `object`                              | Shared seed object                                                                      |
| `seeds`    | `SeedBindings`                        | Seed values keyed by service class, string, or symbol                                   |

Use the second argument for lifecycle and container creation tweaks:

| Option          | Type      | Description                                   |
| --------------- | --------- | --------------------------------------------- |
| `skipMessaging` | `boolean` | Skip `EventBus`, `QueryBus`, and `CommandBus` |
| `skipLifecycle` | `boolean` | Skip `@OnActivated` / `@OnDeactivation` hooks |

```ts
const container = createContainer({
  activate: [CounterService],
  bindings: [CounterService, LoggerService],
});
```

```ts
const container = createContainer({
  activate: true,
  bindings: [CounterService, LoggerService],
});
```

```ts
const container = createContainer({ bindings: [CounterService] }, { skipLifecycle: true });
```

```ts
const container = createContainer({ bindings: [CounterService] }, { skipMessaging: true });
```

`skipMessaging` is for rare containers that only need dependency injection and seeds. A child container can still inherit
messaging buses from a parent. If no parent provides the buses, resolving `WireScope` will fail because `WireScope`
depends on `EventBus`, `QueryBus`, and `CommandBus`.

Use core `bind` and `unbind` with a fresh container when a test needs to add or remove one binding.

```ts
import { bind, unbind } from "@wirestate/core";

const container = createContainer();
const counter = bind(container, CounterService).get(CounterService);

counter.increment();
expect(counter.count).toBe(1);

unbind(container, CounterService);
bind(container, { token: CounterService, value: fakeCounter });
```

## License

MIT
