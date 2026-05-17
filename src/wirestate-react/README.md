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

Root provider. Exposes the top-level container to the React tree. Pass either an existing container instance or
`createContainer(...)` options.

With globally declared container:

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

With locally declared container:

```tsx
import { createContainer, Container } from "@wirestate/core";
import { ContainerActivator, ContainerProvider, useRootContainer } from "@wirestate/react";
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
    <ContainerProvider container={container}>
      <ContainerActivator activate={[LoggerService]}>
        <SomeComponent />
      </ContainerActivator>
    </ContainerProvider>
  );
}
```

### `useRootContainer(factory, deps)`

Creates and memoizes a root container for the component instance.
The factory runs again only when `deps` change or on dev mode HMR refreshment.

```tsx
import { Container, createContainer } from "@wirestate/core";
import { ContainerProvider, useRootContainer } from "@wirestate/react";

function Root() {
  const container: Container = useRootContainer(
    () =>
      createContainer({
        entries: [CounterService, LoggerService],
      }),
    []
  );

  return (
    <ContainerProvider container={container}>
      <SomeComponent />
    </ContainerProvider>
  );
}
```

### `SubContainerProvider`

Creates a child container scoped to a subtree.
Use it under `ContainerProvider` when a branch needs its own service bindings or per-service seeds.

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

| Prop      | Type                | Description                                                                    |
| --------- | ------------------- | ------------------------------------------------------------------------------ |
| `entries` | `InjectableEntries` | Services or binding descriptors to add to the child container.                 |
| `seeds`   | `SeedEntries`       | Per-service seeds, e.g. `[[CounterService, { count: 10 }]]`. Applied on mount. |

### `ContainerActivator`

Resolves a list of already bound services from the current container before rendering children.
Useful when services should be eagerly activated for a subtree.

```tsx
import { ContainerActivator } from "@wirestate/react";
import { CounterService, LoggerService } from "./services";

export function CounterPage() {
  return (
    <ContainerActivator activate={[CounterService, LoggerService]}>
      <CounterView />
    </ContainerActivator>
  );
}
```

`ContainerActivator` runs activation once per container instance. If the container changes, activation runs again.

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

Returns a function that dispatches a command and waits for its result.

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

Returns an async function that calls a query handler and resolves its return value.

```tsx
const query = useQueryCaller();
const items = await query("GET_ITEMS");
```

### `useSyncQueryCaller()`

Same as `useQueryCaller` but calls a synchronous handler.

### `useOptionalQueryCaller()` / `useOptionalSyncQueryCaller()`

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
