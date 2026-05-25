# Containers

A container owns service instances, seed data, and the three message buses.

Same container means same `EventBus`, `CommandBus`, and `QueryBus`. Child container means inherited bindings, separate buses.

## Root Container

```ts
import { Container, Injectable, createContainer } from "@wirestate/core";

@Injectable()
class UserService {}

@Injectable()
class AuthService {}

const container: Container = createContainer({
  seed: { apiUrl: "https://api.example.com" },
  entries: [UserService, AuthService],
  activate: [AuthService],
});
```

`activate` controls eager resolution.

- `true` resolves every entry.
- `false` or omitted keeps services lazy.
- An array resolves only listed tokens.

## Child Containers

Pass `parent` to create a child container.

```ts
import { Container, createContainer } from "@wirestate/core";

const child: Container = createContainer({
  parent: container,
  entries: [CartService],
});
```

Child containers inherit parent bindings. Their buses and targeted seeds stay local. An event in a child does not bubble to the parent.

Use child containers for modal state, checkout flows, tenant scope, or any branch that needs different services.

## React Root Provider

Use `ContainerProvider` at the top of the Wirestate branch.

```tsx
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  const config = useMemo(() => ({ entries: [CounterService, LoggerService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}
```

With `config`, the provider owns the container. It creates it, provisions it, deprovisions it, and disposes it.

With `container`, ownership stays with you. The provider provisions and deprovisions it, but never calls `unbindAll()`.

```tsx
import { Container, createContainer } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";

const container: Container = createContainer({
  entries: [CounterService, LoggerService],
});

export function Application() {
  return (
    <ContainerProvider container={container}>
      <Counter />
    </ContainerProvider>
  );
}
```

## React Child Provider

`SubContainerProvider` creates a managed child container under the nearest provider.

```tsx
import { ReactNode } from "react";
import { SubContainerProvider } from "@wirestate/react";
import { CartService, CheckoutService } from "./services";

export function CheckoutScope(props: { children?: ReactNode }) {
  return <SubContainerProvider entries={[CartService, CheckoutService]}>{props.children}</SubContainerProvider>;
}
```

## Direct React Access

Prefer `useInjection` for normal service use. Reach for `useContainer` or `useScope` when you need the container edge.

```tsx
import { Container, WireScope } from "@wirestate/core";
import { useContainer, useScope } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const scope: WireScope = useScope();

  return <button onClick={() => scope.emitEvent("DEVTOOLS_OPENED")}>{String(container.isBound("DEBUG"))}</button>;
}
```

## Lit Root Provider

Lit uses decorators or controllers. Both create the same `ContainerProvider`.

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { ContainerProvider, containerProvide } from "@wirestate/lit";
import { CartService } from "./CartService";

@customElement("application-root")
class ApplicationRoot extends LitElement {
  @containerProvide({
    config: {
      entries: [CartService],
    },
  })
  private containerProvider!: ContainerProvider;
}
```

Managed Lit root containers are created on connect and disposed on disconnect. External containers are published while connected and never disposed by Lit.

## Lit Child Provider

`subContainerProvide` and `useSubContainerProvider` create managed child containers from the nearest parent context.

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { SubContainerProvider, subContainerProvide } from "@wirestate/lit";
import { CartService } from "./CartService";

@customElement("checkout-scope")
class CheckoutScope extends LitElement {
  @subContainerProvide({
    config: {
      entries: [CartService],
    },
  })
  public containerProvider!: SubContainerProvider;
}
```

The child container is recreated when the parent context changes and destroyed when the host disconnects.

## Lit Injection

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { injection } from "@wirestate/lit";
import { CartService } from "./CartService";

@customElement("cart-icon")
export class CartIcon extends LitElement {
  @injection(CartService)
  private cart!: CartService;

  public render() {
    return html`<span>${this.cart.items.length}</span>`;
  }
}
```
