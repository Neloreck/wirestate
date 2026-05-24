# @wirestate/react [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

React integration for wirestate. Providers and hooks for injecting services and communicating through events, commands, and queries.

## Installation

```bash
npm install @wirestate/core @wirestate/react reflect-metadata
```

## Providers

### `ContainerProvider`

Root provider. Exposes the top-level container to the React tree. Pass either an existing `container` instance or
managed `createContainer(...)` `config`.

When `container` is a prebuilt container instance, the provider uses it as-is and never disposes it. React provider
lifecycle hooks still run for entries registered through Wirestate binding helpers.

```tsx
import { createContainer, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

const container: Container = createContainer({
  entries: [CounterService, LoggerService],
  activate: [LoggerService],
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
entries by default; pass `activate: false` to skip core eager activation, or pass an array to activate only specific entries.

```tsx
import { ContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  return (
    <ContainerProvider config={{ entries: [CounterService, LoggerService] }}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

### `SubContainerProvider`

Creates a child container scoped to a subtree.
Use it under `ContainerProvider` when a branch needs its own service bindings or per-service seeds.
Child containers activate all provided entries by default; pass `activate: false` or a token array to override that.

```tsx
import { ReactNode } from "react";
import { SubContainerProvider } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

function CounterServicesProvider(props: { children?: ReactNode }) {
  return (
    <SubContainerProvider entries={[CounterService, LoggerService]}>
      {props.children}
    </SubContainerProvider>
  );
}

export function CounterPage() {
  return (
    <CounterServicesProvider>
      <CounterView />
    </CounterServicesProvider>
  );
}
```

**Props:**

| Prop       | Type                                  | Description                                                                    |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `entries`  | `InjectableEntries`                   | Services or binding descriptors to add to the child container.                 |
| `seeds`    | `SeedEntries`                         | Per-service seeds, e.g. `[[CounterService, { count: 10 }]]`. Applied on mount. |
| `activate` | `boolean \| Array<ServiceIdentifier>` | `true` by default. Pass `false` or specific entry tokens to control activation. |

## Provider lifecycle

`@OnProvision` and `@OnDeprovision` run when a React provider commits, unmounts, or replaces its container.
They are useful for services that need UI-scoped setup separate from core `@OnActivated` / `@OnDeactivation`.

```ts
import { Injectable } from "@wirestate/core";
import { OnDeprovision, OnProvision } from "@wirestate/react";

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
activation. Managed providers deprovision before disposing their container; external containers are deprovisioned but
remain owned by the caller.

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

### `useEventsHandler(handler)`

Subscribes to all events. The handler receives the event type and payload.

```tsx
useEventsHandler((event) => {
  logger.log(event.type, event.payload);
});
```

## Command hooks

### `useCommandCaller()`

Returns a function that dispatches a command and returns a descriptor for its task.

```tsx
const call = useCommandCaller();

async function handleClick() {
  await call("LOGIN", { username: "alice" }).task;
}
```

### `useOptionalCommandCaller()`

Same as `useCommandCaller` but returns `null` if no handler is registered.

### `useCommandHandler(type, handler)`

Registers a command handler from a component for the lifetime of the component.

```tsx
useCommandHandler("SCROLL_TOP", () => {
  window.scrollTo(0, 0);
});
```

## Query hooks

### `useQueryCaller()`

Returns a function that calls a synchronous query handler and returns its value directly.

```tsx
const query = useQueryCaller();
const items = query("GET_ITEMS");
```

### `useAsyncQueryCaller()`

Returns a function that calls a query handler and resolves its return value as a promise. It accepts both synchronous
and asynchronous handlers.

```tsx
const queryAsync = useAsyncQueryCaller();
const items = await queryAsync("GET_ITEMS");
```

### `useOptionalQueryCaller()` / `useOptionalAsyncQueryCaller()`

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

## Test utilities

```ts
import { withContainerProvider } from "@wirestate/react/test-utils";
```

`withContainerProvider(children, container?)` wraps a React tree with a `ContainerProvider` for use in tests.

## License

MIT
