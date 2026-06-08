# @wirestate/signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Framework-agnostic Preact Signals exports for Wirestate services.

Use this package to create signal-based services once and share them across React and Lit applications. Pair it with
`@wirestate/react-signals` to render React components or `@wirestate/lit-signals` to render Lit elements.

## Install

```bash
npm install @wirestate/core @wirestate/signals
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

The same `CounterService` can now be consumed from a React component (via `@wirestate/react-signals`) or a Lit element
(via `@wirestate/lit-signals`) without changes.

## What Is Included

- Re-exports from `@preact/signals-core` (`signal`, `computed`, `effect`, `batch`, `untracked`, `action`, `createModel`,
  `Signal`, `ReadonlySignal`, and related model types).

## Learn More

- [API reference](https://neloreck.github.io/wirestate/api/wirestate-signals/)
- [Preact Signals docs](https://preactjs.com/guide/v10/signals/)

## License

MIT
