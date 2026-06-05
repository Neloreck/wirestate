# @wirestate/react-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Preact Signals exports for Wirestate React services.

Use this package when React services should hold signal state and React components should update from signal reads.

## Install

```bash
npm install @wirestate/react-signals @preact/signals-react
```

For a full Wirestate React app:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals react @preact/signals-react reflect-metadata
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Signal, computed, signal } from "@wirestate/react-signals";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven = computed(() => this.count.value % 2 === 0);

  public increment(): void {
    this.count.value++;
  }
}
```

## What Is Included

- Re-exports from `@preact/signals-react`.
- `useSignals` and related runtime exports from `@preact/signals-react/runtime`.

For automatic subscriptions when components read `.value` during render, configure the
[`@preact/signals-react-transform`](https://www.npmjs.com/package/@preact/signals-react-transform). Without the
transform, call `useSignals()` in those components.

## Learn More

- [React Signals guide](https://neloreck.github.io/wirestate/react-signals/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-react-signals/)
- [Preact Signals docs](https://preactjs.com/guide/v10/signals)

## License

MIT
