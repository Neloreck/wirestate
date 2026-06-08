# Lit MobX

Use this stack when Lit elements should render service state stored in MobX observables.

Use `@wirestate/mobx` for observable service state and `@wirestate/lit-mobx` for Lit rendering. For MobX and Lit
behavior, use the official [MobX docs](https://mobx.js.org/README.html) and [Lit docs](https://lit.dev/docs/).

## Install

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/lit @wirestate/lit-mobx
```

## Minimal Example

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, injection, provideContainer } from "@wirestate/lit";
import { MobxLitElement } from "@wirestate/lit-mobx";
import { Action, Observable, makeObservable } from "@wirestate/mobx";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@Injectable()
class CounterService {
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

@customElement("counter-application")
class CounterApplication extends LitElement {
  @provideContainer({ config: { bindings: [CounterService] } })
  private provider!: ContainerProvider;

  protected render() {
    return html`<counter-button></counter-button>`;
  }
}

@customElement("counter-button")
class CounterButton extends MobxLitElement {
  @injection(CounterService)
  private counter!: CounterService;

  public render() {
    return html`<button @click=${() => this.counter.increment()}>Count: ${this.counter.count}</button>`;
  }
}
```

## Detailed Pages

- [Lit overview](/lit/overview)
- [Lit containers](/lit/containers)
- [Lit injection](/lit/injection)
- [Lit MobX overview](/lit-mobx/overview)
- [Lit events](/lit/events)
- [Lit commands](/lit/commands)
- [Lit queries](/lit/queries)
- [Lit seeds](/lit/seeds)
- [Lit testing](/lit/testing)
