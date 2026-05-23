# @wirestate/lit [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Lit elements integration for wirestate. Provides container provisioning, dependency injection, and messaging for Lit components.

## Installation

```bash
npm install @wirestate/core @wirestate/lit lit reflect-metadata
```

## Features

- **Dependency Injection**: Inject services from the IoC container using `@injection` decorator or `useInjection` controller.
- **Messaging**:
  - **Events**: Subscribe to events from the global event bus using `@onEvent` or `useOnEvents`.
  - **Commands**: Register command handlers using `@onCommand` or `useOnCommand`.
  - **Queries**: Register query handlers using `@onQuery` or `useOnQuery`.
- **Container Provisioning**: Provide and manage containers within the Lit component tree using `@containerProvide` or `useContainerProvision`.
- **Sub-containers**: Create managed child containers derived from the parent context using `@subContainerProvide`, `useSubContainerProvider`, or `SubContainerProvider`.
- **Test Utilities**: Simplified setup for unit testing components with IoC dependencies.

## Provisioning

### `@containerProvide(options)` / `useContainerProvision(host, options)`

Provides a container to the component tree. It uses Lit Context to propagate the container to child elements.

Pass `container` to expose an existing container, or pass `config` to create and manage one for the host lifecycle.

```typescript
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { containerProvide, ContainerProvider } from "@wirestate/lit";

@customElement("my-app")
class MyApp extends LitElement {
  @containerProvide({
    config: {
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

Creates a managed child container derived from the nearest parent container for the host element's lifetime. The child container is recreated when the parent container changes and destroyed when the host disconnects.

Using the decorator (accessor):

```typescript
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { subContainerProvide, SubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

@customElement("my-app")
class MyApp extends LitElement {
  @subContainerProvide({
    options: {
      entries: [AuthService, UserService],
      activate: [AuthService],
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
    options: {
      entries: [AuthService, UserService],
      activate: [AuthService],
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
    options: {
      entries: [AuthService, UserService],
      activate: [AuthService],
    },
  });
}
```

To seed the child container during creation, pass `seeds` inside `options`:

```typescript
import { LitElement } from "lit";
import { useSubContainerProvider } from "@wirestate/lit";

import { AuthService, UserService } from "./services";

class MyApp extends LitElement {
  private provider: SubContainerProvider = useSubContainerProvider(this, {
    options: {
      entries: [AuthService, UserService],
      seeds: [[AuthService, { role: "admin" }]],
    },
  });
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

## Messaging

### Events

Subscribe to events from the event bus using `@onEvent` decorator or `useOnEvents` controller. Handlers follow the active container context when the nearest container changes.

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
