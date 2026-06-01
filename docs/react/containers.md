# React Containers

`ContainerProvider` makes a Wirestate container available to a React subtree.

## Managed Root Container

Pass `config` when React should create and own the container. The provider provisions it while mounted and disposes it
on unmount.

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

Managed containers activate all bindings by default. Pass `activate: false` to resolve services lazily.

Do not start resource work during activation. React creates managed containers before the provider effect commits. In
Strict Mode, React may create and discard an extra container. Start timers, subscriptions, sockets, and provider-scoped
async work in `@OnProvision`, and clean them up in `@OnDeprovision`. Write provision hooks so setup can be fully undone
and run again. See [Core Lifecycle](/core/lifecycle) for the cross-framework lifecycle map.

Managed providers recreate the container when `parent`, `onError`, `seed`, `seeds`, `bindings`, or `activate` changes by
shallow comparison. Keep config objects and arrays stable with `useMemo` when the container should not be replaced.

## External Root Container

Pass `container` when your code creates and owns the container.

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

External containers are provisioned while the provider is mounted, but they are not disposed. Disposal remains the
caller's responsibility.

## Direct Access

Prefer `useInjection` for normal service use. Use `useContainer` or `useScope` when a component needs container-level
operations.

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
