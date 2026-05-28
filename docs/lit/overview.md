# Lit Overview

`@wirestate/lit` connects Wirestate containers to Lit elements.

Use it for [container providers](/api/wirestate-lit/functions/provideContainer), service injection, and element-lifetime
event, command, and query handlers. Use [Lit Signals](/lit-signals/overview) when Lit services should expose signal
state to templates.

## Install

```bash
npm install @wirestate/core @wirestate/lit lit @lit/context @lit/reactive-element reflect-metadata
```

For Lit APIs and component behavior, use the official [Lit docs](https://lit.dev/docs/) and
[`lit` package](https://www.npmjs.com/package/lit).

The example below uses Lit Signals for service state. Install [Lit Signals](/lit-signals/overview) when using that
pattern.

## Root Element

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, provideContainer, injection } from "@wirestate/lit";
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
  @provideContainer({ config: { bindings: [CounterService] } })
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
    return html` <button @click=${() => this.counter.increment()}>Count: ${watch(this.counter.count)}</button> `;
  }
}
```

## Provider Lifecycle

Lit providers provision containers while the host is connected. Put work that depends on the connected provider —
timers, subscriptions, sockets — in `@OnProvision`, and clean it up in `@OnDeprovision`. Use activation only for cheap
resolution-time initialization that does not need cleanup.

## Lit Package Surface

- `provideContainer`, `provideSubContainer`, `useContainerProvision`, and `useSubContainerProvider` publish containers.
- `injection`, `optionalInjection`, `useInjection`, `useOptionalInjection`, `useContainer`, and `useScope` consume values.
- `onEvent`, `useOnEvents`, and `OnEventController` work with the event bus.
- `onCommand`, `useOnCommand`, and `OnCommandController` work with the command bus.
- `onQuery`, `useOnQuery`, and `OnQueryController` work with the query bus.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider), [`injection`](/api/wirestate-lit/functions/injection),
[`onEvent`](/api/wirestate-lit/functions/onEvent), [`useOnQuery`](/api/wirestate-lit/functions/useOnQuery).
