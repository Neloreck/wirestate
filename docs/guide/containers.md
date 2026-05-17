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
buses — events emitted in a child do not bubble to the parent.

```ts
const child: Container = createContainer({ parent: container });

bindService(child, CartService); // CartService scoped to child
```

Use child containers to isolate a subtree of services (e.g., a modal, a wizard step, a tenant-scoped feature).

## React

### IocProvider

`IocProvider` provides the root container for the React tree. It must be the outermost Wirestate provider.

```tsx
import { createContainer } from "@wirestate/core";
import { IocProvider, useRootContainer } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  const container: Container = useRootContainer(
    () =>
      createContainer({
        entries: [CounterService, LoggerService],
      }),
    []
  );

  return (
    <IocProvider container={container}>
      <IocActivator activate={[LoggerService]}>
        <SomeComponent />
      </IocActivator>
    </IocProvider>
  );
}
```

`useRootContainer` is useful when the root container should be created inside a component and recreated only when dependencies change.
It also respects HMR refreshing and causes store recreation on replacement of dependency services used in provided factory function.

---

For globally declared store outside of React rendering tree following approach can be used:

```tsx
import { createContainer } from "@wirestate/core";
import { IocProvider, useRootContainer } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

const container: Container = createContainer({
  entries: [CounterService, LoggerService],
  activate: [LoggerService],
});

export function Application() {
  return (
    <IocProvider container={container}>
      <SomeComponent />
    </IocProvider>
  );
}
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
    <IocProvider container={container}>
      <InjectablesProvider>
        <CheckoutFlow />
      </InjectablesProvider>
    </IocProvider>
  );
}
```

Services bound at a higher provider are available to all child providers through Inversify's container hierarchy.

### IocActivator

`IocActivator` resolves listed services from the current container before rendering children.
Use it when services are already bound and should be activated eagerly for a subtree.

```tsx
import { IocActivator } from "@wirestate/react";
import { CartService, CheckoutService } from "./services";

export function CheckoutPage() {
  return (
    <IocActivator activate={[CartService, CheckoutService]}>
      <CheckoutFlow />
    </IocActivator>
  );
}
```

Activation runs once per container instance and runs again when the container instance changes.

### Passing Seeds to a Provider

```tsx
const SEEDS = [[CartService, { items: hydratedItems }]];

<InjectablesProvider seeds={SEEDS}>
  <CheckoutFlow />
</InjectablesProvider>;
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
- Pass `options` to create a managed container for the host lifecycle

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { containerProvide, ContainerProvider } from "@wirestate/lit";

import { CartService } from "./CartService";

@customElement("application-root")
class ApplicationRoot extends LitElement {
  @containerProvide({
    options: {
      entries: [CartService],
      activate: [CartService],
      seed: { someData: "value" },
    },
  })
  private containerProvider!: ContainerProvider;
}
```

### subContainerProvide / useSubContainerProvider

Create a managed child container derived from the nearest parent container context.

- The child container inherits parent bindings through the container hierarchy
- The child container is recreated when the parent container changes
- The child container is destroyed when the host disconnects

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { subContainerProvide, SubContainerProvider } from "@wirestate/lit";

import { CartService } from "./CartService";

@customElement("providing-element")
class ProvidingElement extends LitElement {
  @subContainerProvide({
    options: {
      entries: [CartService],
      activate: [CartService],
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
