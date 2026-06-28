# Lit Containers

Lit [providers](/api/wirestate-lit/classes/ContainerProvider) make Wirestate containers available through Lit context.

## Decorator Root Provider

Use `provideContainer` when a host element should create or publish a root container.

```ts
import { ContainerProvider, provideContainer } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  @provideContainer({ config: { bindings: [CounterService] } })
  private provider!: ContainerProvider;

  protected render() {
    return html`<my-counter></my-counter>`;
  }
}
```

Managed containers are created when the host connects and torn down when it disconnects. Teardown deprovisions the
container, then releases its bindings with `unbindAll`. They activate all bindings by default unless `activate` is
provided.

Before the host connects, and after it disconnects, no container value is published from that provider.

Use `@OnProvision` for resource work tied to the connected provider lifetime. Use `@OnDeprovision` to clean it up. Keep
`@OnActivation` for cheap setup that does not open timers, subscriptions, or external handles. See
[Core Lifecycle](/core/lifecycle).

## Messaging

Messaging is opt-in and composable. A container only has the buses contributed by the messaging plugins it registers, so
add `EventsPlugin`, `CommandsPlugin`, or `QueriesPlugin` to `config.plugins` when the element subtree needs them. Each
plugin's `install` binds its bus.

```ts
import { Container, EventsPlugin } from "@wirestate/core";
import { ContainerProvider, provideContainer } from "@wirestate/lit";
import { LitElement } from "lit";
import { CheckoutService, RootService } from "./services";

const rootContainer: Container = new Container({ bindings: [RootService] });

class CheckoutRoot extends LitElement {
  @provideContainer({
    config: { parent: rootContainer, bindings: [CheckoutService], plugins: [new EventsPlugin()] },
  })
  private checkoutProvider!: ContainerProvider;
}
```

To share a parent's bus instead of contributing a local one, set `config.parent` and do not register the plugin on this
container. Senders and handlers resolve buses up the parent chain, so a nested provider reuses an ancestor's bus.
Registering a local plugin instead gives the subtree its own bus.

## Controller Root Provider

Use `useContainerProvider` when a controller-style field fits the element better than a decorator.

```ts
import { ContainerProvider, useContainerProvider } from "@wirestate/lit";
import { LitElement } from "lit";

export class ApplicationRoot extends LitElement {
  private readonly provider: ContainerProvider = useContainerProvider(this, {
    config: { bindings: [CounterService] },
  });
}
```

## External Container

Pass `container` to expose an existing container. The Lit provider provisions it while connected and deprovisions it on
disconnect, but does not dispose it.

```ts
import { Container } from "@wirestate/core";
import { ContainerProvider, provideContainer } from "@wirestate/lit";

const container = new Container({ bindings: [CounterService] });

class ApplicationRoot extends LitElement {
  @provideContainer({ container })
  private provider!: ContainerProvider;
}
```

Use `provider.setValue(nextContainer)` to replace an external container. When the host is connected, the provider
deprovisions the previous container, provisions the next one, and publishes it. When the host is disconnected, the
replacement is stored for the next connection.

Use `provider.setConfig(nextConfig)` to replace a managed provider's config. When connected, the provider deprovisions
and disposes the current managed container, creates a new one, provisions it, and publishes it. When disconnected, the
new config is stored for the next connection.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider),
[`useContainerProvider`](/api/wirestate-lit/functions/useContainerProvider).
