# Lit Containers

Lit [providers](/api/wirestate-lit/classes/ContainerProvider) publish Wirestate containers through Lit context.

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

Use `@OnProvision` for resource work that belongs to the connected provider lifetime. Use `@OnDeprovision` to clean it
up. Keep `@OnActivated` for cheap resolution-time initialization that does not open timers, subscriptions, or external
handles.

## Controller Root Provider

Use `useContainerProvision` when a controller-style field fits the element better than a decorator.

```ts
import { ContainerProvider, useContainerProvision } from "@wirestate/lit";
import { LitElement } from "lit";

export class ApplicationRoot extends LitElement {
  private readonly provider: ContainerProvider = useContainerProvision(this, {
    config: { bindings: [CounterService] },
  });
}
```

## External Container

Pass `container` to expose an existing container. The Lit provider provisions and deprovisions it while connected, but
does not dispose it.

```ts
import { createContainer } from "@wirestate/core";
import { ContainerProvider, provideContainer } from "@wirestate/lit";

const container = createContainer({ bindings: [CounterService] });

class ApplicationRoot extends LitElement {
  @provideContainer({ container })
  private provider!: ContainerProvider;
}
```

## Child Containers

`provideChildContainer` creates a managed child container from the nearest parent context.

```ts
import { ChildContainerProvider, provideChildContainer } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { CartService } from "./CartService";

@customElement("checkout-scope")
class CheckoutScope extends LitElement {
  @provideChildContainer({ config: { bindings: [CartService] } })
  private provider!: ChildContainerProvider;
}
```

The child container is recreated when the parent context changes and destroyed when the host disconnects.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider),
[`useContainerProvision`](/api/wirestate-lit/functions/useContainerProvision),
[`provideChildContainer`](/api/wirestate-lit/functions/provideChildContainer),
[`ChildContainerProvider`](/api/wirestate-lit/classes/ChildContainerProvider).
