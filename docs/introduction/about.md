# About Wirestate

Wirestate is a framework for building application logic using Dependency Injection and reactivity.
It separates your business logic from the UI layer, making it easier to scale, test and maintain.

## Why Wirestate?

- **Rendering Agnostic Logic**: Write services, use them in React, Lit, or with other rendering libraries using custom integration.
- **DI and IOC**: Built on top of InversifyJS, providing a powerful and flexible dependency injection system.
- **Reactivity Choice**: Use MobX, Signals, or any other reactive library that fits your needs.
- **Test-Driven**: Designed to be easily testable.

## Quick Example (React + Signals)

### 1. Define a Service

```ts
import { Injectable } from '@wirestate/core';
import { signal, Signal } from '@wirestate/react-signals';

@Injectable()
export class CounterService {
  public count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value++;
  }
}
```

### 2. Provide the Service

```tsx
import { IocProvider, createInjectablesProvider } from '@wirestate/react';
import { CounterService } from './CounterService';

const InjectablesProvider = createInjectablesProvider([CounterService]);

export function Application() {
  return (
    <InjectablesProvider>
      <Services>
        <Counter />
      </Services>
    </InjectablesProvider>
  );
}
```

### 3. Use the Service

```tsx
import { useInjection } from '@wirestate/react';
import { CounterService } from './CounterService';

export function Counter() {
  const counterService: CounterService = useInjection(CounterService);

  return (
    <button onClick={() => counterService.increment()}>
      Count: {counterService.count.value}
    </button>
  );
}
```
