# React Containers

React [providers](/api/wirestate-react/functions/ContainerProvider) publish Wirestate containers through context.

## Managed Root Container

Pass `config` when the provider should create, provision, deprovision, and dispose the container.

```tsx
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  const config = useMemo(() => ({ bindings: [CounterService, LoggerService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}
```

Managed containers activate all bindings by default. Pass `activate: false` to keep bindings lazy.

Activation is not the right place for resource work. React providers create managed containers before their effect
commits. In Strict Mode, React can create an extra container, discard it, then commit another one. Start timers,
subscriptions, sockets, and provider-scoped async work in `@OnProvision`, and clean them up in `@OnDeprovision`.
Write provision hooks so setup can be fully undone and run again.

Managed providers recreate the container when `parent`, `seed`, `seeds`, `bindings`, or `activate` changes by shallow
comparison. Keep config objects and arrays stable with `useMemo` when the container should not be replaced.

## External Root Container

Pass `container` when ownership stays with your code.

```tsx
import { Container, createContainer } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";

const container: Container = createContainer({
  bindings: [CounterService, LoggerService],
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

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`ContainerProviderProps`](/api/wirestate-react/interfaces/ContainerProviderProps),
[`useContainer`](/api/wirestate-react/functions/useContainer),
[`useScope`](/api/wirestate-react/functions/useScope).
