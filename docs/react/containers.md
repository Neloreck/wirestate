# React Containers

`ContainerProvider` makes a Wirestate container available to a React subtree.

## Managed Root Container

Pass `config` when React should create and own the container. The provider provisions it while mounted and tears it
down on unmount.

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

Managed containers activate all bindings by default. Pass `activate: false` to resolve regular services lazily.
Services with provider lifecycle hooks are still resolved when the provider provisions the container.

Do not start resource work during activation. React creates managed containers before the provider effect commits, and
Strict Mode may create and discard an extra container. Start timers, subscriptions, sockets, and provider-scoped async
work in `@OnProvision`; clean them up in `@OnDeprovision`. See [Core Lifecycle](/core/lifecycle).

The provider reads `config` once when it mounts; later changes to the prop are ignored. To replace the managed
container, remount the provider with a React `key`:

```tsx
<ContainerProvider key={tenantId} config={{ bindings: [TenantService] }}>
  <TenantDashboard />
</ContainerProvider>
```

Remounting tears down the previous container and creates a new one from the current config. Because the config is read
only once, inline config objects are safe.

During development, editing a service file replaces its class. Install [`@wirestate/dev`](/core/hot-reload) to rebuild
the affected containers in place instead of remounting the tree.

## Messaging

Messaging is opt-in and composable. A container only has the buses contributed by its registered plugins, so add
`EventsPlugin`, `CommandsPlugin`, or `QueriesPlugin` to `config.plugins` when the subtree needs them. Each plugin's
`install` binds its bus.

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
the subtree its own bus. Bus injections, React handler hooks, and service-level `@OnEvent`, `@OnCommand`, and `@OnQuery`
handlers all resolve buses up the parent chain. A nested provider can reuse an ancestor's bus, and a child service can
handle messages on that ancestor bus. Service-level handlers subscribe when the container is provisioned and unsubscribe
when it is deprovisioned. A service that declares an `@On*` handler fails fast at provision unless the matching plugin is
registered somewhere in the chain.

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

The same ownership rule applies during development: because the provider does not own an external container, it does not
hot-swap one either. Prefer a managed `config` for containers holding services you edit often, or register the container
as its own [hot-swap owner](/core/hot-reload#owning-the-swap).

## Provision Timing

`ContainerProvider` provisions its container in a layout effect. Handlers declared with `@OnEvent`, `@OnCommand`, and
`@OnQuery` are registered at provision, and React runs a parent's layout effect before any descendant's `useEffect`, so
a component can send from its mount effect.

```tsx
function CheckoutSummaryBadge() {
  const queryBus = useInjection(QueryBus);
  const [summary, setSummary] = useState<CheckoutSummary>({ itemCount: 0 });

  useEffect(() => {
    // Handlers are already registered by the time this runs.
    setSummary(queryBus.query<CheckoutSummary>("CHECKOUT_SUMMARY"));
  }, [queryBus]);

  return <span>{summary.itemCount} items</span>;
}
```

Provision runs before the browser paints, so keep `@OnProvision` to starting work rather than doing it.

Three ordering limits remain, all because React commits effects child-first:

- A descendant's own `useLayoutEffect` runs before the provider provisions. Send from `useEffect` instead.
- A nested `ContainerProvider` provisions its container before the outer one, so a child container's `@OnProvision`
  cannot reach a handler owned by a service in a parent container.
- On unmount the container deprovisions before a descendant's `useEffect` cleanup, so a component cannot send from its
  cleanup. Use `@OnDeprovision` on a service, which runs while the buses are still live.

## Hidden and Revealed Subtrees

A managed container is destroyed shortly after its provider unmounts. React features that unmount effects and later
re-run them on the same component, such as `<Activity mode="hidden">`, can stay hidden past that point. Revealing the
subtree then provisions a container that no longer exists, and the render throws:

```text
Container was destroyed and cannot be used again. Create a new container instead.
```

Use an external `container` for a provider that can be hidden and revealed. The provider deprovisions an external
container when the subtree hides and provisions it again when it returns, and never destroys it, so services keep their
state across the cycle.

```tsx
import { Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { Activity, useMemo } from "react";

function Panel({ visible }: { visible: boolean }) {
  const container = useMemo(() => new Container({ bindings: [CounterService] }), []);

  return (
    <Activity mode={visible ? "visible" : "hidden"}>
      <ContainerProvider container={container}>
        <Counter />
      </ContainerProvider>
    </Activity>
  );
}
```

Disposal stays with the code that created the container. Call `container.destroy()` when the owner is finished with it.

## SSR and Hydration

To hydrate a managed container with server-serialized state, fold that state into `bindings` as a value binding, exactly
like any other [construction-time data](/core/containers#construction-time-data). The provider reads it while creating
the container.

```tsx
import { ContainerConfig, InjectionToken } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";
import { AppState, StoreService } from "./services";

const INITIAL_STATE = new InjectionToken<AppState>("INITIAL_STATE");

export function Application() {
  const config: ContainerConfig = useMemo(
    () => ({ bindings: [StoreService, { token: INITIAL_STATE, value: window.__APP_STATE__ }] }),
    []
  );

  return (
    <ContainerProvider config={config}>
      <App />
    </ContainerProvider>
  );
}
```

The provider reads the config once on mount, so the hydration binding is captured exactly once even when the config is
built inline (see [Managed Root Container](#managed-root-container)).

## Direct Access

Prefer `useInjection` for normal service use. Use `useContainer` when a component needs container-level operations.

```tsx
import { Container, EventBus } from "@wirestate/core";
import { useContainer, useInjection } from "@wirestate/react";

function DevTools() {
  const container: Container = useContainer();
  const eventBus = useInjection(EventBus);

  return <button onClick={() => eventBus.emit("DEVTOOLS_OPENED")}>{String(container.has("DEBUG"))}</button>;
}
```

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`ContainerProviderProps`](/api/wirestate-react/interfaces/ContainerProviderProps),
[`useContainer`](/api/wirestate-react/functions/useContainer).
