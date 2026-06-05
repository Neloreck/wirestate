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

Managed containers are created when the host connects and disposed when it disconnects. They activate all bindings by
default unless `activate` is provided.

Use `@OnProvision` for resource work tied to the connected provider lifetime. Use `@OnDeprovision` to clean it up. Keep
`@OnActivated` for cheap setup that does not open timers, subscriptions, or external handles. See
[Core Lifecycle](/core/lifecycle).

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
import { createContainer } from "@wirestate/core";
import { ContainerProvider, provideContainer } from "@wirestate/lit";

const container = createContainer({ bindings: [CounterService] });

class ApplicationRoot extends LitElement {
  @provideContainer({ container })
  private provider!: ContainerProvider;
}
```

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider),
[`useContainerProvider`](/api/wirestate-lit/functions/useContainerProvider).
