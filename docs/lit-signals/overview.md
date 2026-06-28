# Lit Signals

Use `@wirestate/lit-signals` when Lit elements should render Preact Signal state held by services.

Signal state is defined with `@wirestate/signals`, so the same services work in React via `@wirestate/react-signals`.
Lit rendering is wired through `@wirestate/lit-signals`, which re-exports `SignalWatcher`, `watch`, `withWatch`, `html`,
and `svg`.

## Install

```bash
npm install @wirestate/core @wirestate/signals @wirestate/lit @wirestate/lit-signals
```

## Service

```ts
import { Injectable } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

## Template

Create signals in services or stable element state. Either mix `SignalWatcher` into the element to auto-track signals
read during `render()`, or use the `watch()` directive to subscribe a single binding.

```ts
import { injection } from "@wirestate/lit";
import { SignalWatcher } from "@wirestate/lit-signals";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("my-counter")
export class MyCounter extends SignalWatcher(LitElement) {
  @injection(CounterService)
  private counter!: CounterService;

  protected render() {
    return html`<button @click=${() => this.counter.increment()}>Count: ${this.counter.count.value}</button>`;
  }
}
```

To subscribe a single binding without the mixin, use `watch()`:

```ts
import { watch } from "@wirestate/lit-signals";

html`<span>${watch(this.counter.count)}</span>`;
```

## Computed Signals

```ts
import { ReadonlySignal, Signal, computed, signal } from "@wirestate/signals";

export class CounterState {
  public readonly count: Signal<number> = signal(0);
  public readonly isEven: ReadonlySignal<boolean> = computed(() => this.count.value % 2 === 0);
}
```

## API Reference

[`SignalWatcher`](/api/wirestate-lit-signals/functions/SignalWatcher),
[`watch`](/api/wirestate-lit-signals/variables/watch),
[`withWatch`](/api/wirestate-lit-signals/variables/withWatch), [`html`](/api/wirestate-lit-signals/variables/html),
[`svg`](/api/wirestate-lit-signals/variables/svg), [`signal`](/api/wirestate-signals/functions/signal),
[`computed`](/api/wirestate-signals/functions/computed).

## See Also

- [Lit guide](/lit/overview): providers, decorators, controllers, and element handlers.
- [Lit Signals introduction](/introduction/lit-signals): install and a minimal example.
