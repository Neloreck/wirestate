# Containers

## Root Container

`createIocContainer` creates an Inversify container pre-bound with Wirestate's buses and tokens. All services in the same container share the same `EventBus`, `CommandBus`, and `QueryBus`.

```ts
import { Container, createIocContainer, bindService } from "@wirestate/core";

const container: Container = createIocContainer({ seed: { apiUrl: "https://api.example.com" } });

bindService(container, UserService);
bindService(container, AuthService);
```

You can provide bindings and services to activate directly in the options:

```ts
const container: Container = createIocContainer({
  entries: [UserService, { id: "CONFIG", value: { a: 1, b: 2 } }],
  activate: [UserService],
  seed: { apiUrl: "https://api.example.com" },
  seeds: [[UserService, { cache: false }]],
});
```

## Child Containers

Pass `parent` to create a child container. Child containers inherit parent bindings but maintain independent
buses — events emitted in a child do not bubble to the parent.

```ts
const child: Container = createIocContainer({ parent: container });

bindService(child, CartService); // CartService scoped to child
```

Use child containers to isolate a subtree of services (e.g., a modal, a wizard step, a tenant-scoped feature).

## React

### IocProvider

`IocProvider` creates the root container for the React tree. It must be the outermost Wirestate provider.

```tsx
import { IocProvider } from "@wirestate/react";

export function Application() {
  return (
    <IocProvider>
      <Router />
    </IocProvider>
  );
}
```

Pass a parent container to the root container:

```tsx
<IocProvider container={parentContainer}>
  <Router />
</IocProvider>
```

Pass a seed to the root container:

```tsx
<IocProvider seed={{ apiUrl: process.env.API_URL }}>
  <Router />
</IocProvider>
```

### createInjectablesProvider

Creates a component that binds a fixed list of services to the React tree provided container.
Services are activated on mount and deactivated on unmount.

```ts
import { createInjectablesProvider } from "@wirestate/react";
import { CartService } from "./CartService";
import { CheckoutService } from "./CheckoutService";

export const InjectablesProvider = createInjectablesProvider([CartService, CheckoutService]);
```

```tsx
export function Application() {
  return (
    <IocProvider>
      <InjectablesProvider>
        <CheckoutFlow />
      </InjectablesProvider>
    </IocProvider>
  );
}
```

Services bound at a higher provider are available to all child providers through Inversify's container hierarchy.

### Passing Seeds to a Provider

```tsx
const SEEDS = [[CartService, { items: hydratedItems }]];

<InjectablesProvider seeds={SEEDS}>
  <CheckoutFlow />
</InjectablesProvider>;
```

### Accessing the Container Directly

```tsx
import { Container, WireScope, useContainer, useScope } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const scope: WireScope = useScope();

  // ...
}
```

## Lit

### @iocProvide

Creates the root IoC container on a Lit element.

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { iocProvide } from "@wirestate/lit";

@customElement("application-root")
class ApplicationRoot extends LitElement {
  @iocProvide({ seed: { someData: "value" } })
  private ioc!: IocProviderController;
}
```

### @injectablesProvide

Binds services to the element's container for the lifetime of the element.
Expects IOC context to be provided on the tree above.

```ts
import { iocProvide, injectablesProvide } from "@wirestate/lit";
import { CartService } from "./CartService";

@customElement("providing-element")
class ProvidingElement extends ReactiveElement {
  @injectablesProvide({ entries: [CartService] })
  public servicesProvider!: InjectablesProviderController;
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
