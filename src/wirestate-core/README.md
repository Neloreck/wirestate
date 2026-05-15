# @wirestate/core [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Core package for wirestate.
Provides the DI container, service primitives, and event/command/query buses.
React integration is in [`@wirestate/react`](https://www.npmjs.com/package/@wirestate/react).

## Installation

```bash
npm install @wirestate/core reflect-metadata
```

Import `reflect-metadata` once at your application entry point, before any wirestate imports:

```ts
import 'reflect-metadata';
```

## Services

Services are plain classes decorated with `@Injectable`. Each service may inject a `WireScope` which provides access to the event, command, and query buses and to other services in the container.

```ts
import { Injectable, Inject, WireScope } from '@wirestate/core';

@Injectable()
export class CounterService {
  public count = 0;

  public constructor(
    @Inject(WireScope) private scope: WireScope
  ) {}

  public increment(): void {
    this.count++;
  }
}
```

## Container

```ts
import { createIocContainer, bindService } from '@wirestate/core';

const container = createIocContainer({
  seed: { baseUrl: "https://example.com" },
  entries: [CounterService]
});

bindService(container, AnotherService);

const counterService = container.get(CounterService);
const anotherService = container.get(AnotherService);
```

`bindService` binds a class in singleton scope by default.
Use `bindConstant` to bind a value, `bindEntry` to bind under a custom token.

## Events

Events are fire-and-forget messages. Any service can emit or subscribe.

```ts
import { OnEvent, WireScope, Inject } from '@wirestate/core';

@Injectable()
export class SenderService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public notify(): void {
    this.scope.emitEvent('USER_LOGGED_OUT');
  }
}

@Injectable()
export class ReceiverService {
  @OnEvent('USER_LOGGED_OUT')
  public onLogout(): void {
    // handle logout
  }
}
```

`@OnEvent()` with no argument subscribes to all events.

## Commands

Commands are write operations dispatched by token. A single handler is expected per command type.

```ts
import { OnCommand, WireScope, Inject } from '@wirestate/core';

@Injectable()
export class AuthService {
  @OnCommand('LOGIN')
  public async onLogin(payload: { username: string }): Promise<void> {
    // perform login
  }
}

@Injectable()
export class AnotherService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public async login(): Promise<void> {
    await this.scope.executeCommand('LOGIN').task;
  }
}
```

Use `commandOptional` when a handler may not be registered — returns `null` instead of throwing.

## Queries

Queries are request-response operations. A single handler is expected per query type.

```ts
import { OnQuery, WireScope, Inject } from '@wirestate/core';

@Injectable()
export class StoreService {
  private items: Array<string> = [];

  @OnQuery('STORE_ITEMS')
  public onGetItems(): Array<string> {
    return this.items;
  }
}

@Injectable()
export class AnotherService {
  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public async someActionRequiringItems(): Promise<void> {
    const asyncItems: Array<string> = await this.scope.queryData('STORE_ITEMS');
    const syncItems: Array<string> = await this.scope.queryData('STORE_ITEMS');
  }
}
```

## Seeds

Seeds pass initial data to services when they are activated.

```ts
import { SEED, Injectable, Inject } from '@wirestate/core';

// Shared seed — same object injected into all services in the tree:
@Injectable()
export class MyService {
  public constructor(@Inject(SEED) private seed: { theme: string }) {}
}

// Per-service seed — each service gets its own seed value:
@Injectable()
export class OtherService {
  public constructor(@Inject(WireScope) scope: WireScope) {
    const { count } = scope.getSeed(OtherService) as { count: number };
  }
}
```

Seeds are applied via `applySeeds` / `applySharedSeed` and removed via `unapplySeeds`.
In React, pass them as `seed` or `seeds` props to the provider — see `@wirestate/react`.

## Lifecycle

```ts
import { OnActivated, OnDeactivation } from '@wirestate/core';

@Injectable()
export class PollingService {
  private timer?: ReturnType<typeof setInterval>;

  @OnActivated()
  public onActivated(): void {
    this.timer = setInterval(() => console.info('interval execution'), 5000);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    clearInterval(this.timer);
  }
}
```

`@OnActivated` runs after the service is bound and all dependencies are resolved.
`@OnDeactivation` runs when the container scope is disposed.

## WireScope API

`WireScope` is injected per-service and exposes:

| Method | Description |
|---|---|
| `getContainer()` | Access the raw IoC container |
| `resolve(token)` | Resolve a service or value by token |
| `resolveOptional(token)` | Resolve a service or value, returns `null` if not bound |
| `getSeed(token?)` | Get the per-service or shared seed |
| `emitEvent(type, payload?, from?)` | Emit an event |
| `subscribeToEvent(handler)` | Subscribe a handler to all events; returns unsubscribe function |
| `unsubscribeFromEvent(handler)` | Remove a specific event subscription by handler reference |
| `queryData(type, data?)` | Dispatch a query and return the result |
| `queryOptionalData(type, data?)` | Dispatch a query; returns `null` if no handler is registered |
| `registerQueryHandler(type, handler)` | Register a query handler; returns unregister function |
| `unregisterQueryHandler(type, handler)` | Remove a specific query handler by type and reference |
| `executeCommand(type, data?)` | Dispatch a command and return a descriptor |
| `executeOptionalCommand(type, data?)` | Dispatch a command; returns `null` if no handler is registered |
| `registerCommandHandler(type, handler)` | Register a command handler; returns unregister function |
| `unregisterCommandHandler(type, handler)` | Remove a specific command handler by type and reference |

## Test utilities

Available via `@wirestate/core/test-utils`:

```ts
import {
  mockContainer,
  mockService,
  mockBindService,
  mockBindEntry,
  mockUnbindService,
} from '@wirestate/core/test-utils';
```

### `mockContainer(options?)`

Creates a configured IoC container for testing. Accepts an optional object:

| Option | Type | Description |
|---|---|---|
| `entries` | `Array<Newable \| InjectableDescriptor>` | Services or descriptors to bind |
| `activate` | `Array<ServiceIdentifier>` | Tokens to resolve immediately after binding |
| `skipLifecycle` | `boolean` | Skip `@OnActivated` / `@OnDeactivation` hooks |

```ts
const container = mockContainer({
  entries: [CounterService, LoggerService],
  activate: [CounterService],
});
```

### `mockService(ServiceClass, container?, options?)`

Binds a service class to a container and returns its instance. Creates a new `mockContainer` if none is provided.

```ts
const counter = mockService(CounterService);
counter.increment();
expect(counter.count).toBe(1);
```

### `mockBindService(container, ServiceClass, options?)`

Binds a service class to an existing container. Accepts `{ skipLifecycle?: boolean }`.

### `mockBindEntry(container, entry, options?)`

Binds a service class or `InjectableDescriptor` to an existing container. Accepts `{ skipLifecycle?: boolean }`.

### `mockUnbindService(container, ServiceClass)`

Removes a service binding from the container. Useful for overriding registrations between tests.

```ts
mockUnbindService(container, CounterService);
mockBindEntry(container, { token: CounterService, useValue: fakeCounter });
```

## License

MIT
