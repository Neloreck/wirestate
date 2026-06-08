# @wirestate/lit-mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

MobX Lit reactivity binding for Wirestate Lit services.

Use this package together with [`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx): author observable
service state with `@wirestate/mobx`, then render Lit elements through `@adobe/lit-mobx`.

## Install

```bash
npm install @wirestate/mobx @wirestate/lit-mobx lit mobx
```

For a full Wirestate Lit app:

```bash
npm install @wirestate/core @wirestate/lit @wirestate/mobx @wirestate/lit-mobx lit @lit/context @lit/reactive-element mobx reflect-metadata
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/mobx";

@Injectable()
class CounterService {
  @Observable()
  public count = 0;

  public constructor() {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count++;
  }
}
```

```ts
import { injection } from "@wirestate/lit";
import { MobxLitElement } from "@wirestate/lit-mobx";
import { html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("w-counter")
export class Counter extends MobxLitElement {
  @injection({ token: CounterService })
  private readonly counter!: CounterService;

  public render() {
    return html`<button @click=${() => this.counter.increment()}>${this.counter.count}</button>`;
  }
}
```

The same `CounterService` definition powers React components through
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx).

## What Is Included

- Re-exports from `@adobe/lit-mobx` (`MobxLitElement`, `MobxReactionUpdate`). `@adobe/lit-mobx` ships as a bundled
  dependency, so you do not install it directly.

Observable definitions and decorator aliases (`Observable`, `Action`, `Computed`, …) live in
[`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx).

## Learn More

- [API reference](https://neloreck.github.io/wirestate/api/wirestate-lit-mobx/)
- [lit-mobx docs](https://github.com/adobe/lit-mobx)

## License

MIT
