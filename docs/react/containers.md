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

## Messaging

Messaging is opt-in and composable. A container only has the buses contributed by its registered plugins, so add
`EventsPlugin`, `CommandsPlugin`, or `QueriesPlugin` to `config.plugins` when the subtree needs them. Each plugin's
`install` binds its bus. There is no default trio.

```tsx
import { ContainerConfig, EventsPlugin } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";
import { CheckoutService } from "./services";

function CheckoutFlow() {
  const config: ContainerConfig = useMemo(() => ({ bindings: [CheckoutService], plugins: [new EventsPlugin()] }), []);

  return (
    <ContainerProvider config={config}>
      <Checkout />
    </ContainerProvider>
  );
}
```

To share a parent's bus instead of giving the subtree a local one, set `config.parent` and do not register the matching
plugin on this container; the child then inherits the bus up the parent chain. Registering a local plugin instead gives
the subtree its own bus. Senders, consumer hooks, and service-level `@OnEvent`, `@OnCommand`, and `@OnQuery` handlers all
resolve buses up the parent chain, so a nested provider reuses an ancestor's bus and a child service can handle an
ancestor's bus. Those handlers subscribe when the container is provisioned and unsubscribe when it is deprovisioned. A
service that declares an `@On*` handler fails fast at provision unless the matching plugin is registered somewhere in the
chain.

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

Prefer `useInjection` for normal service use. Use `useContainer` when a component needs container-level operations.

```tsx
import { Container } from "@wirestate/core";
import { useContainer, useEventEmitter } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const emit = useEventEmitter();

  return <button onClick={() => emit("DEVTOOLS_OPENED")}>{String(container.has("DEBUG"))}</button>;
}
```

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`ContainerProviderProps`](/api/wirestate-react/interfaces/ContainerProviderProps),
[`useContainer`](/api/wirestate-react/functions/useContainer).
