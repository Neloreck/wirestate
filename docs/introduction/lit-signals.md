# Lit Signals

Use this stack when Lit elements should render service state stored in Preact Signals.

Use `@wirestate/signals` for service state and `@wirestate/lit-signals` for Lit rendering. For Lit and signal behavior,
use the official [Lit docs](https://lit.dev/docs/) and [Preact Signals docs](https://preactjs.com/guide/v10/signals/).

## Install

```bash
npm install @wirestate/core @wirestate/lit @wirestate/signals @wirestate/lit-signals
```

## Minimal Example

Create signals in services or stable element state. Mix `SignalWatcher` into elements to subscribe rendering to signal
updates.

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, provideContainer, injection } from "@wirestate/lit";
import { SignalWatcher } from "@wirestate/lit-signals";
import { Signal, signal } from "@wirestate/signals";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}

@customElement("counter-application")
class CounterApplication extends LitElement {
  @provideContainer({ config: { bindings: [CounterService] } })
  private provider!: ContainerProvider;

  protected render() {
    return html`<counter-button></counter-button>`;
  }
}

@customElement("counter-button")
class CounterButton extends SignalWatcher(LitElement) {
  @injection(CounterService)
  private counter!: CounterService;

  protected render() {
    return html`<button @click=${() => this.counter.increment()}>Count: ${this.counter.count.value}</button>`;
  }
}
```

## Detailed Pages

- [Lit overview](/lit/overview)
- [Lit containers](/lit/containers)
- [Lit injection](/lit/injection)
- [Lit Signals overview](/lit-signals/overview)
- [Lit events](/lit/events)
- [Lit commands](/lit/commands)
- [Lit queries](/lit/queries)
- [Lit testing](/lit/testing)
