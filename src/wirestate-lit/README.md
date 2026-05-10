# @wirestate/lit

[![npm](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Lit elements integration for wirestate. Provides dependency injection and messaging for Lit components.

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
- **Container Provisioning**: Provide and manage IoC containers within the Lit component tree using `@iocProvide` or `useIocProvision`.
- **Service Binding**: Dynamically bind services to the container using `ServicesProviderController`.
- **Test Utilities**: Simplified setup for unit testing components with IoC dependencies.

## Provisioning

### `@iocProvide(options?)` / `useIocProvision(host, options?)`

Provides an IoC container to the component tree. It uses Lit Context to propagate the container to child elements.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { iocProvide, IocProviderController } from '@wirestate/lit';

@customElement('my-app')
class MyApp extends LitElement {
  @iocProvide()
  private ioc!: IocProviderController;

  render() {
    return html`<my-component></my-component>`;
  }
}
```

### `ServicesProviderController`

Allows binding a set of services to the container scoped to the component's lifetime. Services are activated on connect and deactivated on disconnect.

```typescript
import { LitElement } from 'lit';
import { ServicesProviderController } from '@wirestate/lit';
import { MyService, AnotherService } from './services';

class MyComponent extends LitElement {
  private services = new ServicesProviderController(this, {
    entries: [MyService, AnotherService],
  });
}
```

## Injection

### `@injection(optionsOrId)` / `useInjection(host, optionsOrId)`

Injects a service from the nearest IoC container. Supports both options object and direct service identifier.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { injection } from '@wirestate/lit';
import { MyService } from './services';

@customElement('my-component')
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

Using the controller:

```typescript
import { LitElement, html } from 'lit';
import { useInjection } from '@wirestate/lit';
import { MyService } from './services';

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

Subscribe to events from the event bus using `@onEvent` decorator or `useOnEvents` controller.

```typescript
import { LitElement } from 'lit';
import { onEvent } from '@wirestate/lit';
import { UserLoggedInEvent } from './events';

class MyListener extends LitElement {
  @onEvent("USER_LOGGED_IN")
  private handleLogin(event: UserLoggedInEvent) {
    console.log('User logged in:', event.payload);
  }
}
```

Using the controller:

```typescript
import { LitElement } from 'lit';
import { useOnEvents } from '@wirestate/lit';

class MyListener extends LitElement {
  private events = useOnEvents(this, {
    handler: (event) => console.log('Event received:', event),
  });
}
```

### Commands

Register a handler for a specific command type.

```typescript
import { LitElement } from 'lit';
import { onCommand } from '@wirestate/lit';

class MyCommander extends LitElement {
  @onCommand('RESET_STATE')
  private handleReset() {
    // perform reset
  }
}
```

### Queries

Register a handler for a specific query type.

```typescript
import { LitElement } from 'lit';
import { onQuery } from '@wirestate/lit';

class MyQuerier extends LitElement {
  @onQuery('GET_VIEW_PORT')
  private handleGetViewport() {
    return { width: window.innerWidth, height: window.innerHeight };
  }
}
```

## Test Utilities

### `createLitProvision(container?)`

Creates a test fixture with a provider element and an IoC container. Useful for unit testing components that use injections.

```typescript
import { createLitProvision } from '@wirestate/lit/test-utils';

describe('MyComponent', () => {
  let fixture: ReturnType<typeof createLitProvision>;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it('should work', () => {
    const el = document.createElement('my-component');
    fixture.provider.appendChild(el);
    // ...
  });
});
```

## License

MIT
