# React Signals

Use this stack when React components should render signal state stored in services.

Use `@wirestate/signals` for service state and `@wirestate/react-signals` for React rendering. For signal behavior and
React transform setup, use the official [Preact Signals guide](https://preactjs.com/guide/v10/signals) and
[`@preact/signals-react-transform` package](https://www.npmjs.com/package/@preact/signals-react-transform).

## Install

```bash
npm install @wirestate/core @wirestate/signals @wirestate/react @wirestate/react-signals
```

Install and configure the Preact Signals React transform if components should subscribe when they read signal values
during render.

```json
{
  "plugins": [["module:@preact/signals-react-transform"]]
}
```

If your build cannot use the transform, call `useSignals()` from `@wirestate/react-signals` in components that read
signal `.value` during render.

## Minimal Example

Create signals in services or stable component state. With the transform configured, reading `.value` in render
subscribes the component to updates.

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { Signal, signal } from "@wirestate/signals";
import { useMemo } from "react";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ bindings: [CounterService] }), []);

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
- [React Signals overview](/react-signals/overview)
- [React events](/react/events)
- [React commands](/react/commands)
- [React queries](/react/queries)
- [React testing](/react/testing)
