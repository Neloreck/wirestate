# Lit Signals

Use this stack when Lit elements should render service state stored in Lit Signals.

Install:

```bash
npm install @wirestate/core @wirestate/lit @wirestate/lit-signals lit @lit/context @lit/reactive-element @lit-labs/signals signal-polyfill reflect-metadata
```

## Minimal Example

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, containerProvide, injection } from "@wirestate/lit";
import { State, signal, watch } from "@wirestate/lit-signals";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@Injectable()
class CounterService {
  public readonly count: State<number> = signal(0);

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }
}

@customElement("counter-application")
class CounterApplication extends LitElement {
  @containerProvide({ config: { entries: [CounterService] } })
  private provider!: ContainerProvider;

  protected render() {
    return html`<counter-button></counter-button>`;
  }
}

@customElement("counter-button")
class CounterButton extends LitElement {
  @injection(CounterService)
  private counter!: CounterService;

  protected render() {
    return html`
      <button @click=${() => this.counter.increment()}>
        Count: ${watch(this.counter.count)}
      </button>
    `;
  }
}
```

## Detailed Pages

- [Lit overview](/lit/overview)
- [Lit containers](/lit/containers)
- [Lit injection](/lit/injection)
- [Lit signals](/lit/signals)
- [Lit events](/lit/events)
- [Lit commands](/lit/commands)
- [Lit queries](/lit/queries)
- [Lit seeds](/lit/seeds)
- [Lit testing](/lit/testing)

