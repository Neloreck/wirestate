# @wirestate/lit-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Lit Signals exports for Wirestate Lit services.

Use this package when Lit services should expose signal state and Lit templates should re-render with `watch()`.

## Install

```bash
npm install @wirestate/lit-signals @lit-labs/signals signal-polyfill
```

For a full Wirestate Lit app:

```bash
npm install @wirestate/core @wirestate/lit @wirestate/lit-signals lit @lit/context @lit/reactive-element @lit-labs/signals signal-polyfill reflect-metadata
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { State, signal } from "@wirestate/lit-signals";

@Injectable()
class CounterService {
  public readonly count: State<number> = signal(0);

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }
}
```

In a Lit template:

```ts
import { watch } from "@wirestate/lit-signals";

html`<span>${watch(counter.count)}</span>`;
```

## What Is Included

- Re-exports from `@lit-labs/signals`.
- `State<T>` and `Computed<T>` aliases from `signal-polyfill`.

## Learn More

- [Lit Signals guide](https://neloreck.github.io/wirestate/lit-signals/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-lit-signals/)
- [Lit Signals docs](https://lit.dev/docs/data/signals/)

## License

MIT
