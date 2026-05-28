# @wirestate/react-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Signals adapter for Wirestate React services.

Create signals in services or stable component state. With the React Signals transform configured, reading `.value` in
render subscribes React consumers to updates.

Re-exports `@preact/signals-react` for use with Wirestate services.

## Installation

```bash
npm install @wirestate/react-signals @preact/signals-react
```

For a full Wirestate React + Signals app, install the core and React packages too:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals @preact/signals-react reflect-metadata
```

For automatic component subscription without manual `useSignal` calls, add the Babel or SWC transform:

```bash
npm install --save-dev @preact/signals-react-transform
```

If your build cannot use the transform, import `useSignals()` from `@wirestate/react-signals` in components that read
signal `.value` during render.

## Usage

```ts
import { signal, computed, effect, Signal, ReadonlySignal } from "@wirestate/react-signals";
```

Example service:

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";
import { signal, computed, Signal, ReadonlySignal } from "@wirestate/react-signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven: ReadonlySignal<boolean> = computed(() => this.count.value % 2 === 0);

  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public increment(): void {
    this.count.value++;
  }
}
```

## License

MIT
