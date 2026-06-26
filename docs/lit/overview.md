# Lit Overview

`@wirestate/lit` connects Wirestate containers to Lit elements.

Use it when Lit elements need access to a Wirestate container:
[container providers](/api/wirestate-lit/functions/provideContainer), injection helpers, and element handlers for local
events, commands, and queries.

Use [Lit Signals](/lit-signals/overview) or [Lit MobX](/lit-mobx/overview) when service state should update templates.

## Install

```bash
npm install @wirestate/core @wirestate/lit
```

For Lit APIs and component behavior, use the official [Lit docs](https://lit.dev/docs/) and
[`lit` package](https://www.npmjs.com/package/lit).

The example below uses Lit Signals for service state. Add those packages when using that pattern:

```bash
npm install @wirestate/signals @wirestate/lit-signals
```

## Root Element

Provide a container from a root element, then inject services in child elements.

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

## Provider Lifecycle

Lit providers provision containers while the host element is connected. Put work that depends on that connected lifetime
in `@OnProvision`, such as timers, subscriptions, and sockets. Clean it up in `@OnDeprovision`. Use activation only for
cheap setup that does not need cleanup. The core [lifecycle map](/core/lifecycle) shows where Lit connect, disconnect,
activation, and disposal fit together.

## Lit Package Surface

- `provideContainer` and `useContainerProvider` publish containers.
- `injection`, `useInjection`, and `useContainer` consume values.
- `onEvent`, `useOnEvents`, and `OnEventController` work with the event bus.
- `onCommand`, `useOnCommand`, and `OnCommandController` work with the command bus.
- `onQuery`, `useOnQuery`, and `OnQueryController` work with the query bus.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider), [`injection`](/api/wirestate-lit/functions/injection),
[`onEvent`](/api/wirestate-lit/functions/onEvent), [`useOnQuery`](/api/wirestate-lit/functions/useOnQuery).
