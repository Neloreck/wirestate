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

Do not start resource work during activation. React creates managed containers before the provider effect commits, and
Strict Mode may create and discard an extra container. Start timers, subscriptions, sockets, and provider-scoped async
work in `@OnProvision`; clean them up in `@OnDeprovision`. See [Core Lifecycle](/core/lifecycle).

Managed providers recreate the container when `parent`, `onError`, `bindings`, or `activate` changes by
shallow comparison. Keep config objects and arrays stable with `useMemo` when the container should not be replaced.

## Messaging Scope

Managed providers create container-local event, command, and query buses by default. Pass `scope="parent"` when a child
container should inherit those buses from `config.parent`.

```tsx
import { Container, ContainerConfig } from "@wirestate/core";
import { ContainerProvider, useContainer } from "@wirestate/react";
import { useMemo } from "react";
import { CheckoutService } from "./services";

function CheckoutFlow() {
  const parent: Container = useContainer();
  const config: ContainerConfig = useMemo(() => ({ parent, bindings: [CheckoutService] }), [parent]);

  return (
    <ContainerProvider config={config} scope={"parent"}>
      <Checkout />
    </ContainerProvider>
  );
}
```

`scope="parent"` affects only managed containers. External containers keep the buses they were created with.

## External Root Container

Pass `container` when your code creates and owns the container.

```tsx
import { Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";

const container: Container = new Container({
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

  return <button onClick={() => scope.emitEvent("DEVTOOLS_OPENED")}>{String(container.has("DEBUG"))}</button>;
}
```

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`ContainerProviderProps`](/api/wirestate-react/interfaces/ContainerProviderProps),
[`ContainerProviderScope`](/api/wirestate-react/enumerations/ContainerProviderScope),
[`useContainer`](/api/wirestate-react/functions/useContainer),
[`useScope`](/api/wirestate-react/functions/useScope).
