# @wirestate/react-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Re-exports `@preact/signals-react` for use with wirestate services.

## Installation

```bash
npm install @wirestate/react-signals @preact/signals-react
```

For automatic component subscription without manual `useSignal` calls, add the Babel or SWC transform:

```bash
npm install --save-dev @preact/signals-react-transform
```

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
