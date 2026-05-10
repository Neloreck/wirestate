# @wirestate/lit

[![npm](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Lit elements integration for wirestate. Provides dependency injection and event handling for Lit components.

## Features

- **Dependency Injection**: Inject services from the IoC container using `@injection` decorator or `useInjection` controller.
- **Event Handling**: Subscribe to events from the global event bus using `@onEvent` decorator or `useOnEvents` controller.
- **Container Provisioning**: Provide and manage IoC containers within the Lit component tree using `@iocProvide` or `useIocProvision`.
- **Service Binding**: Dynamically bind services to the container using `ServicesProviderController`.

## Installation

```bash
npm install @wirestate/core @wirestate/lit lit reflect-metadata
```

## Usage

### Provisioning the Container

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

### Injecting Services

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { injection } from '@wirestate/lit';
import { MyService } from './services';

@customElement('my-component')
class MyComponent extends LitElement {
  @injection({ injectionId: MyService })
  private myService!: MyService;

  render() {
    return html`<div>${this.myService.getData()}</div>`;
  }
}
```

### Handling Events

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { onEvent } from '@wirestate/lit';
import { MyEvent } from './events';

@customElement('my-listener')
class MyListener extends LitElement {
  @onEvent(MyEvent)
  private handleMyEvent(event: MyEvent) {
    console.log('Received event:', event);
  }
}
```

## License

MIT
