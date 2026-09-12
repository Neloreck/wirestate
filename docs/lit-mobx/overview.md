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

Legacy MobX decorators only record annotations, so they need `makeObservable(this)`.

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

Alternatively, register `ObservablePlugin` on the root container. It calls `makeObservable` for every activated
service that carries legacy MobX decorator annotations, so services skip the constructor call.

```ts
import { Container } from "@wirestate/core";
import { ObservablePlugin } from "@wirestate/mobx";

const container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
```

### Standard Decorators

The snippets above use legacy experimental decorators (`experimentalDecorators: true`). With TC39 standard decorators
MobX applies annotations itself while the instance initializes: observable fields are declared with `accessor`, no
`makeObservable` call is needed, and `ObservablePlugin` is a no-op that can be left out of the container.

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable } from "@wirestate/mobx";

@Injectable()
export class CounterService {
  @Observable()
  public accessor count: number = 0;

  @Action()
  public increment(): void {
    this.count += 1;
  }
}
```

The `accessor` keyword is required for observable fields in this mode: MobX rejects `@Observable()` on a plain field.
Getters and methods are declared the same way in both modes.

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
[`Computed`](/api/wirestate-mobx/functions/Computed),
[`ObservablePlugin`](/api/wirestate-mobx/classes/ObservablePlugin).

## See Also

- [Lit guide](/lit/overview): providers, decorators, controllers, and element handlers.
- [Installation](/introduction/installation): packages for every stack.
