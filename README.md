# <a href='https://www.npmjs.com/package/wirestate'> ⚡ wirestate </a>

[![npm version](https://img.shields.io/npm/v/wirestate.svg?style=flat-square)](https://www.npmjs.com/package/wirestate)
[![language-ts](https://img.shields.io/badge/language-typescript-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/search?l=typescript)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

`wirestate` is a state management framework for React. It integrates **InversifyJS** for robust Dependency Injection 
and **MobX** for high-performance reactivity, providing IOC/DI/indirection based architecture based on concepts of Services, Events, Commands, and Queries.

## Architecture & Core Concepts

Designed for complex applications, `wirestate` enforces a clear separation of concerns:

- **Services**: Singleton-scoped logic units that hold state and business logic.
- **Dependency Injection**: First-class InversifyJS integration for decoupled, testable code.
- **Reactivity**: Transparent state tracking powered by MobX.
- **Events**: Fire-and-forget communication for cross-service side effects.
- **Commands**: Encapsulated write operations with standardized execution status (pending, settled, error).
- **Queries**: Synchronous or asynchronous request-response patterns for data retrieval.
- **Lifecycle Management**: Automated services provision within react tree, activation/deactivation lifecycle. 

## Installation

```bash
npm install wirestate mobx mobx-react-lite reflect-metadata
```

## Requirements

- `react >= 16.8.0`
- `mobx >= 6.0.0`
- `reflect-metadata` (must be imported at application entry)

## Quick Start

### 1. Define a Service

Services are standard classes decorated with `@Injectable`. Use `WireScope` to interact with the framework.

```typescript
import { Injectable, Inject, WireScope, OnEvent, OnCommand, OnQuery } from 'wirestate';
import { makeObservable, Observable, Action } from 'wirestate/mobx';

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(
    @Inject(WireScope)
    private scope: WireScope
  ) {
    makeObservable(this);
  }

  @Action()
  public increment(amount: number = 1): void {
    this.count += amount;
  }

  @Action()
  public reset(): void {
    this.count = 0;
  }

  @OnCommand('INCREMENT')
  public onIncrementCommand(amount: number = 1): void {
    this.increment(amount);
  }

  @OnQuery('GET_TOTAL')
  public onGetTotal(): number {
    return this.count;
  }

  @OnEvent('RESET')
  public onResetEvent(): void {
    this.reset();
  }
}
```

### 2. Configure the Provider

Bind services at any level of the component tree.
Lifetimes are managed automatically.

```tsx
import { IocProvider, createInjectablesProvider } from 'wirestate';
import { CounterService } from './CounterService';

const MainProvider = createInjectablesProvider([CounterService]);

export function Application() {
  return (
    <IocProvider>
      <MainProvider>
        <CounterView />
      </MainProvider>
    </IocProvider>
  );
}
```

### 3. Consume in Components

Directly use services and rely on mobx reactivity.
Or use specialized hooks for communication without direct references.

```tsx
import { observer } from 'wirestate/mobx';
import { useInjection, useCommandCaller, useEventEmitter } from 'wirestate';
import { CounterService } from './CounterService';

export const CounterView = observer(() => {
  const service = useInjection(CounterService);
  const call = useCommandCaller();
  const emit = useEventEmitter();

  return (
    <div>
      <p>Count: {service.count}</p>
      <button onClick={() => service.increment(5)}>Add 1 (Method)</button>
      <button onClick={() => call('INCREMENT', 5)}>Add 5 (Command)</button>
      <button onClick={() => service.reset()}>Reset (Method)</button>
      <button onClick={() => emit('RESET')}>Reset (Event)</button>
    </div>
  );
});
```

## Advanced Usage

### Seeding Shared Initial State

`wirestate` supports providing initial data (seeds) to services during activation.

```tsx
const MainProvider = createInjectablesProvider([CounterService]);

<IocProvider>
  <MainProvider seed={{ initialCount: 100 }}>
    <CounterView />
  </MainProvider>
</IocProvider>
```

In the service:

```typescript
import { Injectable, Inject, SEED } from 'wirestate';

@Injectable()
export class CounterService {
  // ...
  public constructor(
    @Inject(SEED) 
    initialState: { initialCount: number  }
  ) {
    this.count = seed.initialCount;
  }
}
```

### Seeding Bound Initial State

`wirestate` supports providing initial data (seeds) to services during activation.

```tsx
const MainProvider = createInjectablesProvider([CounterService]);

<IocProvider>
  <MainProvider seeds={[[CounterService, { count: 10 }]]}>
    <CounterView />
  </MainProvider>
</IocProvider>
```

In the service:

```typescript
import { Injectable, Inject, WireScope } from 'wirestate';

@Injectable()
export class CounterService {
  // ...
  public constructor(@Inject(WireScope) scope: WireScope) {
    this.count = scope.getSeed(CounterService).count;
  }
}
```

### Service Lifecycle

Use decorators to handle initialization and cleanup.

```typescript
import { OnActivated, OnDeactivation } from 'wirestate';

@OnActivated()
public onActivated(): void {
  // Start polling, fetch initial data, etc.
}

@OnDeactivation()
public onDeactivation(): void {
  // Cleanup subscriptions
}
```

## License

MIT
