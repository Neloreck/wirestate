# React Signals

Use `@wirestate/react-signals` when React components should render Preact Signal state held by services.

Signal state is defined with `@wirestate/signals`. React rendering is wired through `@wirestate/react-signals`, which
re-exports `useSignal`, `useSignals`, and related hooks. Wirestate does not wrap or change signal behavior.

For signal API details, use the official [Preact Signals guide](https://preactjs.com/guide/v10/signals) and
[`@preact/signals-react` package](https://www.npmjs.com/package/@preact/signals-react).

## Install

```bash
npm install @wirestate/core @wirestate/react @wirestate/signals @wirestate/react-signals
```

See the [`@preact/signals-react-transform` package](https://www.npmjs.com/package/@preact/signals-react-transform) for
transform setup details.

Install and add the Preact Signals React transform to your Babel config if components should subscribe when they read
signal values during render.

```json
{
  "plugins": [["module:@preact/signals-react-transform"]]
}
```

If your build cannot use the transform, call `useSignals()` from `@wirestate/react-signals` in components that read
signal `.value` during render.

## Service

```ts
import { Injectable } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

## Component

With the transform configured, React consumers re-render when they read signal `.value` during render. Keep signal
creation in services or stable component state.

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
import { Signal, computed, signal } from "@wirestate/signals";

export class CounterState {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven = computed(() => this.count.value % 2 === 0);
}
```

## API Reference

[`signal`](/api/wirestate-signals/functions/signal), [`Signal`](/api/wirestate-signals/classes/Signal),
[`computed`](/api/wirestate-signals/functions/computed), [`useSignal`](/api/wirestate-react-signals/functions/useSignal).

## See Also

- [React guide](/react/overview): providers, injection hooks, and component-owned handlers.
- [Installation](/introduction/installation): packages for every stack.
