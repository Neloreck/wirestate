# Lit Containers

Lit [providers](/api/wirestate-lit/classes/ContainerProvider) publish Wirestate containers through Lit context.

## Decorator Root Provider

Use `containerProvide` when a host element should create or publish a root container.

```ts
import { ContainerProvider, containerProvide } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  @containerProvide({
    config: {
      entries: [CounterService],
    },
  })
  private provider!: ContainerProvider;

  protected render() {
    return html`<my-counter></my-counter>`;
  }
}
```

Managed containers are created when the host connects and disposed when it disconnects. They activate all entries by
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
    config: { entries: [CounterService] },
  });
}
```

## External Container

Pass `container` to expose an existing container. The Lit provider provisions and deprovisions it while connected, but
does not dispose it.

```ts
import { createContainer } from "@wirestate/core";
import { ContainerProvider, containerProvide } from "@wirestate/lit";

const container = createContainer({ entries: [CounterService] });

class ApplicationRoot extends LitElement {
  @containerProvide({ container })
  private provider!: ContainerProvider;
}
```

## Child Container

`subContainerProvide` creates a managed child container from the nearest parent context.

```ts
import { SubContainerProvider, subContainerProvide } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { CartService } from "./CartService";

@customElement("checkout-scope")
class CheckoutScope extends LitElement {
  @subContainerProvide({
    config: {
      entries: [CartService],
    },
  })
  private provider!: SubContainerProvider;
}
```

The child container is recreated when the parent context changes and destroyed when the host disconnects.

## API Reference

[`containerProvide`](/api/wirestate-lit/functions/containerProvide),
[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider),
[`useContainerProvision`](/api/wirestate-lit/functions/useContainerProvision),
[`subContainerProvide`](/api/wirestate-lit/functions/subContainerProvide),
[`SubContainerProvider`](/api/wirestate-lit/classes/SubContainerProvider).
