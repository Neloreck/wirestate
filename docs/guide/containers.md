# Containers

## Root Container

`createContainer` creates an Inversify container pre-bound with Wirestate's buses and tokens. All services in the same container share the same `EventBus`, `CommandBus`, and `QueryBus`.

```ts
import { Container, createContainer, bindService } from "@wirestate/core";

const container: Container = createContainer({ seed: { apiUrl: "https://api.example.com" } });

bindService(container, UserService);
bindService(container, AuthService);
```

You can provide bindings and services to activate directly in the options:

```ts
const container: Container = createContainer({
  seed: { apiUrl: "https://api.example.com" },
  seeds: [[UserService, { cache: false }]],
  entries: [UserService, { id: "CONFIG", value: { a: 1, b: 2 } }],
  activate: [UserService],
});
```

## Child Containers

Pass `parent` to create a child container. Child containers inherit parent bindings but maintain independent
buses - events emitted in a child do not bubble to the parent.

```ts
const child: Container = createContainer({ parent: container });

bindService(child, CartService); // CartService scoped to child
```

Use child containers to isolate a subtree of services (e.g., a modal, a wizard step, a tenant-scoped feature).

## React

### ContainerProvider

`ContainerProvider` provides the root container for the React tree. It must be the outermost Wirestate provider.

```tsx
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  return (
    <ContainerProvider config={{ entries: [CounterService, LoggerService] }}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

When `config` is provided, `ContainerProvider` creates and owns the container. Managed React containers activate all
provided entries by default; pass `activate: false` to skip core eager activation, or pass an array to activate only
specific entries.

React provider lifecycle hooks are separate from eager activation. Services decorated with `@OnProvision` or
`@OnDeprovision` from `@wirestate/core`, and services that inject `WireScope`, are resolved when the provider commits
so provider hooks and scope deprovision state can run even when `activate: false` is used. Managed containers are
deprovisioned before disposal; external containers are deprovisioned when the provider unmounts or switches containers,
but the provider never calls `unbindAll()` for them.

For a globally declared container outside the React rendering tree, use a prebuilt container:

```tsx
import { Container, createContainer } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

const container: Container = createContainer({
  entries: [CounterService, LoggerService],
  activate: [LoggerService],
});

export function Application() {
  return (
    <ContainerProvider container={container}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

### SubContainerProvider

`SubContainerProvider` creates a child container under the current `ContainerProvider` and binds services for that subtree.
Use it when a branch of the tree needs scoped services or per-service seeds.

```tsx
import { ReactNode } from "react";
import { SubContainerProvider } from "@wirestate/react";
import { CartService } from "./CartService";
import { CheckoutService } from "./CheckoutService";

export function CheckoutServicesProvider(props: { children?: ReactNode }) {
  return (
    <SubContainerProvider entries={[CartService, CheckoutService]}>
      {props.children}
    </SubContainerProvider>
  );
}
```

```tsx
export function Application() {
  return (
    <ContainerProvider container={container}>
      <CheckoutServicesProvider>
        <CheckoutFlow />
      </CheckoutServicesProvider>
    </ContainerProvider>
  );
}
```

Services bound at a higher provider are available to child providers through Inversify's container hierarchy.
Child React containers also activate all provided entries by default. Pass `activate: false` or an array of entry tokens to
`SubContainerProvider` when a scoped branch needs different activation behavior.

### Passing Seeds to a Provider

```tsx
import { SeedEntries } from "@wirestate/core";

const SEEDS: SeedEntries = [[CartService, { items: hydratedItems }]];

<SubContainerProvider entries={[CartService, CheckoutService]} seeds={SEEDS}>
  <CheckoutFlow />
</SubContainerProvider>;
```

### Accessing the Container Directly

```tsx
import { Container, WireScope } from "@wirestate/core";
import { useContainer, useScope } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const scope: WireScope = useScope();

  // ...
}
```

## Lit

### containerProvide / useContainerProvision

Provide a root container to a Lit subtree.

- Pass `container` to expose an existing container
- Pass `config` to create a managed container for the host lifecycle
- Managed Lit containers activate all provided entries by default; pass `activate: false` to skip eager activation, or
  pass an array to activate only specific entries
- Lit providers run `@OnProvision` while connected, track `WireScope.isDeprovisioned` for scoped services, and run `@OnDeprovision` before disconnect cleanup

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { containerProvide, ContainerProvider } from "@wirestate/lit";

import { CartService } from "./CartService";

@customElement("application-root")
class ApplicationRoot extends LitElement {
  @containerProvide({
    config: {
      entries: [CartService],
      seed: { someData: "value" },
    },
  })
  private containerProvider!: ContainerProvider;
}
```

### subContainerProvide / useSubContainerProvider

Create a managed child container derived from the nearest parent container context.

- The child container inherits parent bindings through the container hierarchy
- The child container is created when the host connects to an ancestor container context
- The child container is recreated when the parent container changes
- The child container is destroyed when the host disconnects
- The child container is deprovisioned before it is destroyed
- Managed Lit child containers activate all provided entries by default; pass `activate: false` or a token array to
  override that

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { subContainerProvide, SubContainerProvider } from "@wirestate/lit";

import { CartService } from "./CartService";

@customElement("providing-element")
class ProvidingElement extends LitElement {
  @subContainerProvide({
    config: {
      entries: [CartService],
    },
  })
  public containerProvider!: SubContainerProvider;
}
```

### @injection

Injects a service into a Lit element property from the nearest parent container.

```ts
import { injection } from "@wirestate/lit";
import { CartService } from "./CartService";

@customElement("cart-icon")
export class CartIcon extends LitElement {
  @injection(CartService)
  private cart!: CartService;

  public render() {
    return html`<span>${this.cart.items.value.length}</span>`;
  }
}
```
