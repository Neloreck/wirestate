# Lit Signals

Use `@wirestate/lit-signals` when Lit services should expose Lit Signals.

The package re-exports `@lit-labs/signals` and the `State<T>` and `Computed<T>` types from `signal-polyfill`.

## Service

```ts
import { Injectable } from "@wirestate/core";
import { State, signal } from "@wirestate/lit-signals";

@Injectable()
export class CounterService {
  public readonly count: State<number> = signal(0);

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }
}
```

## Template

Use `watch` in templates to subscribe the element to the signal.

```ts
import { injection } from "@wirestate/lit";
import { watch } from "@wirestate/lit-signals";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("my-counter")
export class MyCounter extends LitElement {
  @injection(CounterService)
  private counter!: CounterService;

  protected render() {
    return html`<button @click=${() => this.counter.increment()}>Count: ${watch(this.counter.count)}</button>`;
  }
}
```

## Computed Signals

```ts
import { Computed, State, computed, signal } from "@wirestate/lit-signals";

export class CounterState {
  public readonly count: State<number> = signal(0);
  public readonly isEven: Computed<boolean> = computed(() => this.count.get() % 2 === 0);
}
```


---

API reference: [`signal`](/api/wirestate-lit-signals/variables/signal), [`State`](/api/wirestate-lit-signals/type-aliases/State),
[`Computed`](/api/wirestate-lit-signals/type-aliases/Computed), [`watch`](/api/wirestate-lit-signals/variables/watch),
[`computed`](/api/wirestate-lit-signals/variables/computed).
