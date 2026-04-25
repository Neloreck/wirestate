# <a href='https://www.npmjs.com/package/wirestate'> ⚡ wirestate </a>

[![npm version](https://img.shields.io/npm/v/wirestate.svg?style=flat-square)](https://www.npmjs.com/package/wirestate)
[![language-ts](https://img.shields.io/badge/language-typescript-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/search?l=typescript)
<br/>
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

<hr/>

`wirestate` is a lightweight, scalable state management library for React, leveraging **Inversify** for Dependency Injection and **MobX** for reactivity. It provides a robust architecture for managing complex application logic through **Services**, **Signals**, and **Queries**.

## Key Features

- **Dependency Injection**: First-class support for Inversify, allowing for decoupled and testable services.
- **Reactive State**: Seamless integration with MobX.
- **Signals**: An event-based communication system for broadcasting actions and side effects across your application.
- **Queries**: A structured way to request data synchronously or asynchronously from your services.
- **Service Lifecycle**: Automated activation and deactivation of services tied to your component tree.

## Install

- `npm install --save wirestate`

## Requirements

- `react >= 16.8.0`
- `mobx >= 6.0.0`
- `mobx-react-lite >= 4.0.0`
- `inversify >= 8.0.0`

## Documentation

- [InversifyJS](https://inversify.io/)
- [MobX](https://mobx.js.org/)
- [MobX-React](https://mobx.js.org/react-integration.html)

## Quick Start

### 1. Define a Service

```typescript
import { AbstractService, OnSignal, OnQuery, makeAutoObservable } from 'wirestate';

export class CounterService extends AbstractService {
  public count: number = 0;

  public constructor() {
    super();
    makeAutoObservable(this);
  }

  @OnSignal('INCREMENT')
  public increment(): void {
    this.count++;
  }

  @OnQuery('GET_COUNT')
  public getCount(): number {
    return this.count;
  }
}
```

### 2. Provide Services in React

```tsx
import { IocProvider, createInjectablesProvider } from 'wirestate';
import { CounterService } from './CounterService';

const InjectablesProvider = createInjectablesProvider([CounterService]);

function Application() {
  return (
    <IocProvider>
      <InjectablesProvider>
        <CounterComponent />
      </InjectablesProvider>
    </IocProvider>
  );
}
```

### 3. Consume in Components

```tsx
import { observer } from 'mobx-react-lite';
import { useInjection, useSignalEmitter } from 'wirestate';
import { CounterService } from './CounterService';

const CounterComponent = observer(() => {
  const service = useInjection(CounterService);
  const emit = useSignalEmitter();

  return (
    <div>
      <p>Count: {service.count}</p>
      <button onClick={() => service.increment()}>Increment</button>
      <button onClick={() => emit({ type: 'INCREMENT' })}>Increment signal</button>
    </div>
  );
});
```

## Proposals and contribution

Feel free to open PRs or issues. <br/>

## Licence

MIT
