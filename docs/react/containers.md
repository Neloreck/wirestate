# React Containers

React [providers](/api/wirestate/functions/ContainerProvider) publish Wirestate containers through context.

## Managed Root Container

Pass `config` when the provider should create, provision, deprovision, and dispose the container.

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

Managed containers activate all entries by default. Pass `activate: false` to keep entries lazy.

Activation is not the right place for resource work. React providers create managed containers before their effect
commits. In Strict Mode, React can create an extra container, discard it, then commit another one. Start timers,
subscriptions, sockets, and provider-scoped async work in `@OnProvision`, and clean them up in `@OnDeprovision`.
Write provision hooks so setup can be fully undone and run again.

## External Root Container

Pass `container` when ownership stays with your code.

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

External containers are provisioned and deprovisioned by the provider, but they are not disposed.

For external containers, provider lifecycle still runs while the provider is mounted. Disposal remains the caller's
responsibility.

## Child Containers

`SubContainerProvider` creates a managed child container under the nearest parent provider.

```tsx
import { ReactNode } from "react";
import { SubContainerProvider } from "@wirestate/react";
import { CartService, CheckoutService } from "./services";

export function CheckoutScope(props: { children?: ReactNode }) {
  return <SubContainerProvider entries={[CartService, CheckoutService]}>{props.children}</SubContainerProvider>;
}
```

Child containers inherit parent bindings and own their own buses, seeds, lifecycle, and disposal.

## Direct Access

Prefer `useInjection` for normal service use. Reach for `useContainer` or `useScope` when a component needs the
container edge.

```tsx
import { Container, WireScope } from "@wirestate/core";
import { useContainer, useScope } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const scope: WireScope = useScope();

  return <button onClick={() => scope.emitEvent("DEVTOOLS_OPENED")}>{String(container.isBound("DEBUG"))}</button>;
}
```

## API Reference

[`ContainerProvider`](/api/wirestate/functions/ContainerProvider),
[`ContainerProviderProps`](/api/wirestate/interfaces/ContainerProviderProps),
[`SubContainerProvider`](/api/wirestate/functions/SubContainerProvider),
[`SubContainerProviderProps`](/api/wirestate/interfaces/SubContainerProviderProps), [`useContainer`](/api/wirestate/functions/useContainer),
[`useScope`](/api/wirestate/functions/useScope).
