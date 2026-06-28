# @wirestate/lit-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Preact Signals Lit reactivity binding for Wirestate Lit services.

Use this package together with [`@wirestate/signals`](https://www.npmjs.com/package/@wirestate/signals): create signal
state with `@wirestate/signals`, then re-render Lit elements with `SignalWatcher` or the `watch()` directive.

## Install

```bash
npm install @wirestate/core @wirestate/lit @wirestate/signals @wirestate/lit-signals
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

In a Lit element:

```ts
import { injection } from "@wirestate/lit";
import { SignalWatcher } from "@wirestate/lit-signals";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("w-counter")
export class Counter extends SignalWatcher(LitElement) {
  @injection(CounterService)
  private readonly counter!: CounterService;

  public render() {
    return html`<button @click=${() => this.counter.increment()}>${this.counter.count.value}</button>`;
  }
}
```

The same `CounterService` definition powers React components through
[`@wirestate/react-signals`](https://www.npmjs.com/package/@wirestate/react-signals).

## What Is Included

- Re-exports from `@lit-labs/preact-signals` (`SignalWatcher`, `watch`, `withWatch`, `html`, `svg`).

Signal definitions (`signal`, `computed`, `effect`, and others) live in
[`@wirestate/signals`](https://www.npmjs.com/package/@wirestate/signals).

## Learn More

- [Lit Signals guide](https://Neloreck.github.io/wirestate/lit-signals/overview)
- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-lit-signals/)
- [lit-labs/preact-signals docs](https://www.npmjs.com/package/@lit-labs/preact-signals)

## License

MIT
