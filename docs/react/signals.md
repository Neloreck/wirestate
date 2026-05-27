# React Signals

Use `@wirestate/react-signals` when React services should store Preact Signals.

The package re-exports `@preact/signals-react`. Wirestate does not wrap or change signal behavior.

## Service

```ts
import { Injectable } from "@wirestate/core";
import { Signal, signal } from "@wirestate/react-signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

## Component

Signals re-render React consumers when read during render.

```tsx
import { useInjection } from "@wirestate/react";
import { CounterService } from "./CounterService";

export function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count.value}</button>;
}
```

## Derived State

Use the signal APIs directly.

```ts
import { Signal, computed, signal } from "@wirestate/react-signals";

export class CounterState {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven = computed(() => this.count.value % 2 === 0);
}
```


---

API reference: [`signal`](/api/wirestate-react-signals/functions/signal), [`Signal`](/api/wirestate-react-signals/classes/Signal),
[`computed`](/api/wirestate-react-signals/functions/computed), [`useSignal`](/api/wirestate-react-signals/functions/useSignal).
