# @wirestate/lit [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Wirestate integration for Lit elements. Provides container provisioning, dependency injection, and messaging for Lit components.

## Installation

```bash
npm install @wirestate/core @wirestate/lit reflect-metadata
npm install lit @lit/context @lit/reactive-element
```

Lit component behavior is covered by the official [Lit docs](https://lit.dev/docs/) and
[`lit` package](https://www.npmjs.com/package/lit).

## Features

- **Dependency Injection**: Inject services from the IoC container using `@injection` decorator or `useInjection` controller.
- **Messaging**:
  - **Events**: Subscribe to events from the active container's event bus using `@onEvent` or `useOnEvents`.
  - **Commands**: Register command handlers using `@onCommand` or `useOnCommand`.
  - **Queries**: Register query handlers using `@onQuery` or `useOnQuery`.
- **Container Provisioning**: Provide and manage containers within the Lit component tree using `@containerProvide` or `useContainerProvision`.
- **Sub-containers**: Create managed child containers derived from the parent context using `@subContainerProvide`, `useSubContainerProvider`, or `SubContainerProvider`.
- **Test Utilities**: Simplified setup for unit testing components with IoC dependencies.

## Provisioning

### `@containerProvide(options)` / `useContainerProvision(host, options)`

Provides a container to the component tree. It uses Lit Context to propagate the container to child elements.

Pass `container` to expose an existing container, or pass `config` to create and manage one for the host lifecycle.
Managed Lit containers activate all provided entries by default; pass `activate: false` to skip eager activation, or pass
an array to activate only specific entries. Both modes run core provider lifecycle hooks while the host is connected.
Services that inject `WireScope` also receive provider deprovision state updates, even when they do not declare provider
lifecycle hooks.
External containers are deprovisioned on disconnect, but they are never disposed by Lit. The provider value is only
published while the host is connected; before first connect and after disconnect, `ContainerProvider.value` is
`undefined`.

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { containerProvide, ContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

@customElement("my-app")
class MyApp extends LitElement {
  @containerProvide({
    config: {
      entries: [AuthService, UserService],
      seed: { someData: "value" },
    },
  })
  private containerProvider!: ContainerProvider;

  render() {
    return html`<my-component></my-component>`;
  }
}
```

### `@subContainerProvide(options)` / `useSubContainerProvider(host, options)`

Creates a managed child container derived from the nearest parent container for the host element's lifetime. The child
container is created when the host connects, recreated when the parent container changes, and destroyed when the host
disconnects. Child containers activate all provided entries by default; pass `activate: false` or an array to activate
only specific entries. Before first connect and after disconnect, `SubContainerProvider.value` is `undefined`.

Using the decorator (accessor):

```typescript
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { subContainerProvide, SubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

@customElement("my-app")
class MyApp extends LitElement {
  @subContainerProvide({
    config: {
      entries: [AuthService, UserService],
    },
  })
  public containerProvider!: SubContainerProvider;
}
```

Using the hook:

```typescript
import { LitElement } from "lit";
import { useSubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

class MyApp extends LitElement {
  private container = useSubContainerProvider(this, {
    config: {
      entries: [AuthService, UserService],
    },
  });
}
```

Using the provider directly:

```typescript
import { LitElement } from "lit";
import { SubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

class MyApp extends LitElement {
  private containerProvider: SubContainerProvider = new SubContainerProvider(this, {
    config: {
      entries: [AuthService, UserService],
    },
  });
}
```

To seed the child container during creation, pass `seeds` inside `config`:

```typescript
import { LitElement } from "lit";
import { useSubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

class MyApp extends LitElement {
  private provider: SubContainerProvider = useSubContainerProvider(this, {
    config: {
      entries: [AuthService, UserService],
      seeds: [[AuthService, { role: "admin" }]],
    },
  });
}
```

## Provider lifecycle

`@OnProvision` and `@OnDeprovision` run when Lit root or child providers connect, disconnect, or replace a managed child
container. Import them from `@wirestate/core` so the same service can be used by different providers.
Use provider lifecycle for timers, subscriptions, sockets, observers, and async work that needs cleanup.
Injected `WireScope` instances expose `isDeprovisioned` for provider ownership state and `isInactive` as the usual guard
for async work that should stop after provider deprovision or service disposal.

```typescript
import { Injectable, OnDeprovision, OnProvision } from "@wirestate/core";

@Injectable()
export class PanelService {
  @OnProvision()
  public onProvision(): void {
    // provider connected
  }

  @OnDeprovision()
  public onDeprovision(): void {
    // provider disconnected or replaced
  }
}
```

## Injection

### `@injection(optionsOrId)` / `useInjection(host, optionsOrId)`

Injects a service from the nearest parent container. Supports both options object and direct service identifier.

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { injection } from "@wirestate/lit";

import { MyService } from "./services";

@customElement("my-component")
class MyComponent extends LitElement {
  // Using identifier:
  @injection(MyService)
  private myService!: MyService;

  // Using options object:
  @injection({ injectionId: MyService, once: true })
  private onceService!: MyService;

  render() {
    return html`<div>${this.myService.getData()}</div>`;
  }
}
```

Using the hook:

```typescript
import { LitElement, html } from "lit";
import { useInjection } from "@wirestate/lit";

import { MyService } from "./services";

class MyComponent extends LitElement {
  // Using identifier:
  private myService = useInjection(this, MyService);

  // Using options object:
  private onceService = useInjection(this, { injectionId: MyService, once: true });

  render() {
    return html`<div>${this.myService.value.getData()}</div>`;
  }
}
```

### `@optionalInjection(optionsOrId, onFallback?)` / `useOptionalInjection(host, optionsOrId, onFallback?)`

Safely resolves a service from the nearest parent container. Returns `null` when the service is not bound, or calls the
fallback function when one is provided.

```typescript
import { LitElement, html } from "lit";
import { optionalInjection, useOptionalInjection } from "@wirestate/lit";

import { ConsoleLoggerService, LoggerService } from "./services";

class MyComponent extends LitElement {
  @optionalInjection(LoggerService, (container) => container.get(ConsoleLoggerService))
  private decoratedLogger: LoggerService | null = null;

  private logger = useOptionalInjection(this, LoggerService, (container) => container.get(ConsoleLoggerService));

  render() {
    return html`<div>${this.logger.value?.getName() ?? "No logger"}</div>`;
  }
}
```

## Messaging

### Events

Subscribe to events from the event bus using `@onEvent` decorator or `useOnEvents` controller. Handlers follow the
active container context when the nearest container changes. Emit with `WireScope.emitEvent(type, payload?, { from })`
when an event should carry an explicit source.

```typescript
import { LitElement } from "lit";
import { onEvent } from "@wirestate/lit";

import { UserLoggedInEvent } from "./events";

class MyListener extends LitElement {
  @onEvent("USER_LOGGED_IN")
  private handleLogin(event: UserLoggedInEvent) {
    console.log("User logged in:", event.payload);
  }
}
```

Using the controller:

```typescript
import { LitElement } from "lit";
import { useOnEvents } from "@wirestate/lit";

class MyListener extends LitElement {
  private events = useOnEvents(this, {
    handler: (event) => console.log("Event received:", event),
  });
}
```

### Commands

Register a handler for a specific command type. Handlers follow the active container context when the nearest container changes.

```typescript
import { LitElement } from "lit";
import { onCommand } from "@wirestate/lit";

class MyCommander extends LitElement {
  @onCommand("RESET_STATE")
  private handleReset() {
    // perform reset
  }
}
```

### Queries

Register a handler for a specific query type. Handlers follow the active container context when the nearest container changes.

```typescript
import { LitElement } from "lit";
import { onQuery } from "@wirestate/lit";

class MyQuerier extends LitElement {
  @onQuery("GET_VIEW_PORT")
  private handleGetViewport() {
    return { width: window.innerWidth, height: window.innerHeight };
  }
}
```

## Test Utilities

### `createLitProvision(container?)`

Creates a test fixture with a provider element and an IoC container. Useful for unit testing components that use injections.

```typescript
import { createLitProvision } from "@wirestate/lit/test-utils";

describe("MyComponent", () => {
  let fixture: ReturnType<typeof createLitProvision>;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should work", () => {
    const el = document.createElement("my-component");
    fixture.provider.appendChild(el);
    // ...
  });
});
```

## License

MIT
