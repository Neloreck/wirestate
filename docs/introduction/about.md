# About Wirestate

Wirestate is a TypeScript framework for application logic built on InversifyJS and external reactivity.
It keeps state and workflows outside UI code.

## Why Wirestate?

- **UI-Separated Logic**: Keep services outside components, with React, Lit, or custom adapters managing UI lifecycle.
- **DI and IoC**: Built on InversifyJS.
- **Reactivity Choice**: Use MobX, Signals, or any other reactive library that fits your needs.
- **Testable Services**: Test business logic without rendering UI.

## Quick Example (React + Signals)

### 1. Define a Service

```ts
import { Injectable } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

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
import { createContainer, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService } from "./CounterService";

const container: Container = createContainer({
  entries: [CounterService],
});

export function Application() {
  return (
    <ContainerProvider container={container}>
      <Counter />
    </ContainerProvider>
  );
}
```

### 3. Use the Service

```tsx
import { useInjection } from "@wirestate/react";
import { CounterService } from "./CounterService";

export function Counter() {
  const counterService: CounterService = useInjection(CounterService);

  return <button onClick={() => counterService.increment()}>Count: {counterService.count.value}</button>;
}
```
