# @wirestate/react [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

React integration for Wirestate. Providers and hooks for injecting services and communicating through events, commands, and queries.

## Installation

```bash
npm install @wirestate/core @wirestate/react reflect-metadata
```

React runtime behavior is covered by the official [React docs](https://react.dev/reference/react) and
[`react` package](https://www.npmjs.com/package/react).

## Providers

### `ContainerProvider`

Root provider. Exposes the top-level container to the React tree. Pass either an existing `container` instance or
managed `createContainer(...)` `config`.

When `container` is a prebuilt container instance, the provider uses it as-is and never disposes it. React provider
lifecycle hooks still run for bindings registered through Wirestate binding helpers.

```tsx
import { createContainer, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

const container: Container = createContainer({
  activate: [LoggerService],
  bindings: [CounterService, LoggerService],
});

export function Application() {
  return (
    <ContainerProvider container={container}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

When `config` is provided, `ContainerProvider` creates and owns the container. Managed containers activate all provided
bindings by default; pass `activate: false` to skip core eager activation, or pass an array to activate only specific bindings.

```tsx
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  return (
    <ContainerProvider config={{ bindings: [CounterService, LoggerService] }}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

## Provider lifecycle

`@OnProvision` and `@OnDeprovision` run when a React provider commits, unmounts, or replaces its container.
Use them for services that need UI-scoped setup or cleanup.
Import them from `@wirestate/core` for services shared across React and Lit.

Managed React providers create containers before the effect that provisions them. In Strict Mode, React can create an
extra managed container, discard it, and commit another one. Do not start timers, subscriptions, sockets, or other
cleanup-requiring work in `@OnActivated`; start it in `@OnProvision` and stop it in `@OnDeprovision`.
Write provision hooks so setup can be fully undone and run again.

```ts
import { Injectable, OnDeprovision, OnProvision } from "@wirestate/core";

@Injectable()
export class LoggerService {
  @OnProvision()
  public onProvision(): void {
    // provider committed
  }

  @OnDeprovision()
  public onDeprovision(): void {
    // provider removed or replaced
  }
}
```

Provider lifecycle services are resolved so their hooks can run, even when `activate: false` skips general eager
activation. Services that inject `WireScope` also participate so `scope.isDeprovisioned` and `scope.isInactive` reflect
provider ownership even without provider hooks. Managed providers deprovision before disposing their container;
external containers are deprovisioned but remain owned by the caller.

## Injection hooks

### `useInjection(token)`

Resolves a value from the nearest container. Re-resolves when the container resets.

```tsx
import { useInjection } from "@wirestate/react";
import { CounterService } from "./services";

function CounterView() {
  const counter = useInjection(CounterService);
  return <span>{counter.count}</span>;
}
```

### `useOptionalInjection(token)`

Same as `useInjection` but returns `null` if the token is not bound.

## Event hooks

### `useEventEmitter()`

Returns a function that emits an event into the current container's event bus.

```tsx
const emit = useEventEmitter();

emit("RESET");
emit("ADD", { amount: 5 });
emit("OPENED", { panel: "cart" }, { from: "cart-button" });
```

### `useEvent(type, handler)`

Subscribes a handler to a single event type for the lifetime of the component.

```tsx
useEvent("RESET", (event) => {
  console.log(event.type, event.payload);
});
```

### `useEvents(types, handler)`

Subscribes to multiple event types with a single handler.

```tsx
useEvents(["RESET", "CLEAR"], (event) => {
  console.log(event.type, event.payload);
});
```

### `useAllEvents(handler)`

Subscribes to all events. The handler receives a `WireEvent` object.

```tsx
useAllEvents((event) => {
  logger.log(event.type, event.payload);
});
```

## Command hooks

### `useCommandExecutor()`

Returns a function that dispatches a command and returns the handler result as-is.

```tsx
const executeCommand = useCommandExecutor();

function handleClick() {
  executeCommand("LOGIN", { username: "alice" });
}
```

### `useAsyncCommandExecutor()`

Returns a function that dispatches a command and resolves its return value as a promise. It accepts both synchronous and
asynchronous handlers.

```tsx
const executeCommandAsync = useAsyncCommandExecutor();

async function handleClick() {
  await executeCommandAsync("LOGIN", { username: "alice" });
}
```

### `useOptionalCommandExecutor()`

Same as `useCommandExecutor` but returns `null` if no handler is registered.

### `useOptionalAsyncCommandExecutor()`

Same as `useAsyncCommandExecutor` but resolves to `null` if no handler is registered.

### `useCommandHandler(type, handler)`

Registers a command handler from a component for the lifetime of the component.

```tsx
useCommandHandler("SCROLL_TOP", () => {
  window.scrollTo(0, 0);
});
```

## Query hooks

Query execution can resolve services and run user handlers. Avoid calling query executors directly during render; call
them from an effect, event handler, or memoized callback and render cached component state.

### `useQueryExecutor()`

Returns a function that calls a synchronous query handler and returns its value directly.

```tsx
const query = useQueryExecutor();
const [items, setItems] = useState<Array<Item>>([]);

useEffect(() => {
  setItems(query("GET_ITEMS"));
}, [query]);
```

### `useAsyncQueryExecutor()`

Returns a function that calls a query handler and resolves its return value as a promise. It accepts both synchronous
and asynchronous handlers.

```tsx
const queryAsync = useAsyncQueryExecutor();
const [items, setItems] = useState<Array<Item>>([]);

const refreshItems = useCallback(async () => {
  setItems(await queryAsync("GET_ITEMS"));
}, [queryAsync]);
```

### `useOptionalQueryExecutor()` / `useOptionalAsyncQueryExecutor()`

Return `null` when no handler is registered instead of throwing.

### `useQueryHandler(type, handler)`

Registers a query handler from a component.

```tsx
useQueryHandler("GET_SCROLL_POS", () => window.scrollY);
```

## Container hooks

### `useContainer()`

Returns the nearest `Container` instance. Useful for advanced manual resolution.

### `useScope()`

Returns the current `WireScope` linked to the nearest container.

Use `scope.isInactive` as the usual async guard in services; it becomes `true` after instance disposal or provider
deprovision.

## License

MIT
