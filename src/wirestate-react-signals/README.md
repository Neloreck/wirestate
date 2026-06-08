# @wirestate/react-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Preact Signals React reactivity binding for Wirestate React services.

Use this package together with [`@wirestate/signals`](https://www.npmjs.com/package/@wirestate/signals): create signal
state with `@wirestate/signals`, then read and subscribe to it from React components.

## Install

```bash
npm install @wirestate/signals @wirestate/react-signals @preact/signals-react @preact/signals-core
```

For a full Wirestate React app:

```bash
npm install @wirestate/core @wirestate/react @wirestate/signals @wirestate/react-signals react @preact/signals-react @preact/signals-core reflect-metadata
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Signal, computed, signal } from "@wirestate/signals";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven = computed(() => this.count.value % 2 === 0);

  public increment(): void {
    this.count.value++;
  }
}
```

```tsx
import { useInjection } from "@wirestate/react";
import { useSignals } from "@wirestate/react-signals";

export const Counter = () => {
  useSignals();

  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>{counter.count.value}</button>;
};
```

## What Is Included

- React hooks from `@preact/signals-react` (`useSignal`, `useComputed`, `useSignalEffect`, `useModel`).
- Runtime exports from `@preact/signals-react/runtime` (`useSignals`, `EffectStore`, `wrapJsx`, `ensureFinalCleanup`).

Signal definitions (`signal`, `computed`, `effect`, …) live in
[`@wirestate/signals`](https://www.npmjs.com/package/@wirestate/signals).

For automatic subscriptions when components read `.value` during render, configure the
[`@preact/signals-react-transform`](https://www.npmjs.com/package/@preact/signals-react-transform). Without the
transform, call `useSignals()` in those components.

## Learn More

- [React Signals guide](https://neloreck.github.io/wirestate/react-signals/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-react-signals/)
- [Preact Signals docs](https://preactjs.com/guide/v10/signals)

## License

MIT
