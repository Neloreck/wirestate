# React Signals

Use this stack when React components should render service state stored in Preact Signals.

Install:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals @preact/signals-react reflect-metadata
```

## Minimal Example

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { Signal, signal } from "@wirestate/react-signals";
import { useMemo } from "react";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ entries: [CounterService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count.value}</button>;
}
```

## Detailed Pages

- [React overview](/react/overview)
- [React containers](/react/containers)
- [React injection](/react/injection)
- [React signals](/react/signals)
- [React events](/react/events)
- [React commands](/react/commands)
- [React queries](/react/queries)
- [React seeds](/react/seeds)
- [React testing](/react/testing)

