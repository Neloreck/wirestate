# Lit MobX

Use `@wirestate/lit-mobx` when Lit elements should render MobX state held by services.

Observable state is defined with `@wirestate/mobx`, which re-exports MobX and provides decorator aliases such as
`Observable`, `Action`, `BoundAction`, and `Computed`. Lit rendering is wired through `@wirestate/lit-mobx`, which
re-exports Adobe's [`@adobe/lit-mobx`](https://www.npmjs.com/package/@adobe/lit-mobx) adapter.

For MobX and Lit behavior, use the official [MobX docs](https://mobx.js.org/README.html) and
[`@adobe/lit-mobx` package](https://www.npmjs.com/package/@adobe/lit-mobx).

## Install

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/lit @wirestate/lit-mobx
```

## Service

MobX decorators need `makeObservable(this)`.

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor() {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count += 1;
  }
}
```

## Element

Extend `MobxLitElement` when the element reads observable state during `render()`.

```ts
import { injection } from "@wirestate/lit";
import { MobxLitElement } from "@wirestate/lit-mobx";
import { html } from "lit";
import { customElement } from "lit/decorators.js";

import { CounterService } from "./CounterService";

@customElement("my-counter")
export class MyCounter extends MobxLitElement {
  @injection(CounterService)
  private counter!: CounterService;

  public render() {
    return html`<button @click=${() => this.counter.increment()}>Count: ${this.counter.count}</button>`;
  }
}
```

The same service can be rendered from React through `@wirestate/react-mobx`.

## Computed Values

```ts
import { Injectable } from "@wirestate/core";
import { Computed, Observable, makeObservable } from "@wirestate/mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 10;

  public constructor() {
    makeObservable(this);
  }

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }
}
```

## API Reference

[`MobxLitElement`](/api/wirestate-lit-mobx/classes/MobxLitElement),
[`MobxReactionUpdate`](/api/wirestate-lit-mobx/functions/MobxReactionUpdate),
[`Observable`](/api/wirestate-mobx/functions/Observable), [`Action`](/api/wirestate-mobx/functions/Action),
[`Computed`](/api/wirestate-mobx/functions/Computed).

## See Also

- [Lit guide](/lit/overview): providers, decorators, controllers, and element handlers.
- [Installation](/introduction/installation): packages for every stack.
