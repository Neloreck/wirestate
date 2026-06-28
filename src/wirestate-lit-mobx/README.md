# @wirestate/lit-mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

MobX Lit reactivity binding for Wirestate Lit services.

Use this package together with [`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx): create observable
service state with `@wirestate/mobx`, then render Lit elements through Adobe's
[`@adobe/lit-mobx`](https://www.npmjs.com/package/@adobe/lit-mobx) adapter.

## Install

```bash
npm install @wirestate/core @wirestate/lit @wirestate/mobx @wirestate/lit-mobx
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
  @injection(CounterService)
  private readonly counter!: CounterService;

  public render() {
    return html`<button @click=${() => this.counter.increment()}>${this.counter.count}</button>`;
  }
}
```

The same `CounterService` definition powers React components through
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx).

## What Is Included

- Re-exports from Adobe's [`@adobe/lit-mobx`](https://www.npmjs.com/package/@adobe/lit-mobx) adapter
  (`MobxLitElement`, `MobxReactionUpdate`). It ships as a bundled dependency, so you do not install it directly.

Observable definitions and decorator aliases (`Observable`, `Action`, `Computed`, and others) live in
[`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx).

## Learn More

- [Lit MobX guide](https://Neloreck.github.io/wirestate/lit-mobx/overview)
- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-lit-mobx/)
- [`@adobe/lit-mobx` package](https://www.npmjs.com/package/@adobe/lit-mobx)

## License

MIT
