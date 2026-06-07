# React Signals

Use `@wirestate/react-signals` when React services should store signal state.

The package exposes the React Signals APIs through the Wirestate adapter. Wirestate does not wrap or change signal
behavior.

For signal API details, use the official [Preact Signals guide](https://preactjs.com/guide/v10/signals) and
[`@preact/signals-react` package](https://www.npmjs.com/package/@preact/signals-react).

## Install

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals react @preact/signals-react reflect-metadata
npm install --save-dev @preact/signals-react-transform
```

See the [`@preact/signals-react-transform` package](https://www.npmjs.com/package/@preact/signals-react-transform) for
transform setup details.

Add the Preact Signals React transform to your Babel config so components that read signal values during render are
subscribed automatically.

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
import { Signal, computed, signal } from "@wirestate/react-signals";

export class CounterState {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven = computed(() => this.count.value % 2 === 0);
}
```

## API Reference

[`signal`](/api/wirestate-react-signals/functions/signal), [`Signal`](/api/wirestate-react-signals/classes/Signal),
[`computed`](/api/wirestate-react-signals/functions/computed), [`useSignal`](/api/wirestate-react-signals/functions/useSignal).
