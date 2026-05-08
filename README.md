# <a href='https://www.npmjs.com/package/wirestate'> ⚡ wirestate </a>

[![npm version](https://img.shields.io/npm/v/wirestate.svg?style=flat-square)](https://www.npmjs.com/package/wirestate)
[![language-ts](https://img.shields.io/badge/language-typescript-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/search?l=typescript)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

`wirestate` is a reactivity-independent state management framework for React. It integrates **InversifyJS** for robust Dependency Injection,
providing IOC/DI/indirection based architecture based on concepts of Services, Events, Commands, and Queries. 

It optionally works with **MobX**, **Signals**, or other custom reactivity implementations.

## Architecture & Core Concepts

Designed for complex applications, `wirestate` enforces a clear separation of concerns:

- **Services**: Singleton-scoped logic units that hold state and business logic.
- **Dependency Injection**: First-class InversifyJS integration for decoupled, testable code.
- **Reactivity**: Independent state tracking (optional integration with MobX, Signals, etc.).
- **Events**: Fire-and-forget communication for cross-service side effects.
- **Commands**: Encapsulated write operations with standardized execution status (pending, settled, error).
- **Queries**: Synchronous or asynchronous request-response patterns for data retrieval.
- **Lifecycle Management**: Automated services provision within react tree, activation/deactivation lifecycle. 

## Requirements

- `react >= 16.8.0`
- `reflect-metadata` (must be imported at application entry)

## Installation

```bash
npm install --save @wirestate/core reflect-metadata
```

### For react-mobx

```bash
npm install --save @wirestate/react @wirestate/react-mobx mobx mobx-react-lite
```

### For signals

```bash
npm install --save @wirestate/react @wirestate/react-signals @preact/signals-react
npm install --save-dev @preact/signals-react-transform
```

## Quick Start with mobx

### 1. Define a Service

Services are standard classes decorated with `@Injectable`. Use `WireScope` to interact with the framework.

```typescript
import { Injectable, Inject, WireScope, OnEvent, OnCommand, OnQuery } from '@wirestate/core';
import { makeObservable, Observable, Action } from '@wirestate/react-mobx';

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
import { IocProvider, createInjectablesProvider } from '@wirestate/react';
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
import { useInjection, useCommandCaller, useEventEmitter } from '@wirestate/react';
import { observer } from '@wirestate/react-mobx';
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

## Quick Start with signals

### 1. Define a Service

Services use `signal` and `computed` for state management.

```typescript
import { Injectable, Inject, WireScope, OnEvent, OnCommand, OnQuery } from '@wirestate/core';
import { signal, computed, Signal, ReadonlySignal } from '@wirestate/react-signals';

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven: ReadonlySignal<boolean> = computed(() => this.count.value % 2 === 0);

  public constructor(
    @Inject(WireScope)
    private scope: WireScope
  ) {}

  public increment(amount: number = 1): void {
    this.count.value += amount;
  }

  public reset(): void {
    this.count.value = 0;
  }

  @OnCommand('INCREMENT')
  public onIncrementCommand(amount: number = 1): void {
    this.increment(amount);
  }

  @OnQuery('GET_TOTAL')
  public onGetTotal(): number {
    return this.count.value;
  }

  @OnEvent('RESET')
  public onResetEvent(): void {
    this.reset();
  }
}
```

### 2. Configure the Provider

The provider configuration remains the same regardless of the reactivity implementation.

```tsx
import { IocProvider, createInjectablesProvider } from '@wirestate/react';
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

Access signals directly in components. Reactivity is handled by the signals transform or manual subscription.

```tsx
import { useInjection, useCommandCaller, useEventEmitter } from '@wirestate/react';
import { CounterService } from './CounterService';

export function CounterView() {
  const service = useInjection(CounterService);
  const call = useCommandCaller();
  const emit = useEventEmitter();

  return (
    <div>
      <p>Count: {service.count}</p>
      <p>Even: {service.isEven.value ? 'Yes' : 'No'}</p>
      <button onClick={() => service.increment(5)}>Add 1 (Method)</button>
      <button onClick={() => call('INCREMENT', 5)}>Add 5 (Command)</button>
      <button onClick={() => service.reset()}>Reset (Method)</button>
      <button onClick={() => emit('RESET')}>Reset (Event)</button>
    </div>
  );
}
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
