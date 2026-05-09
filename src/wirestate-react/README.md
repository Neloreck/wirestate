# @wirestate/react

[![npm](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

React integration for wirestate. Providers and hooks for injecting services and communicating through events, commands, and queries.

## Installation

```bash
npm install @wirestate/core @wirestate/react reflect-metadata
```

## Providers

### `IocProvider`

Root provider. Creates the top-level IoC container. Place once near the root of your application.

```tsx
import { IocProvider } from '@wirestate/react';

export function App() {
  return (
    <IocProvider>
      <SomeComponent />
    </IocProvider>
  );
}
```

### `createInjectablesProvider`

Creates a component that binds a set of services into a child container scoped to the component's lifetime.
Services are activated on mount and deactivated on unmount. Expects to be under `IocProvider` tree.

```tsx
import { createInjectablesProvider } from '@wirestate/react';
import { CounterService, LoggerService } from './services';

const InjectionProvider = createInjectablesProvider([CounterService, LoggerService]);

export function CounterPage() {
  return (
    <InjectionProvider>
      <CounterView />
    </InjectionProvider>
  );
}
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `seed` | `object` | Shared seed injected into all services via `@Inject(SEED)` |
| `seeds` | `SeedEntries` | Per-service seeds, e.g. `[[CounterService, { count: 10 }]]` |

Both `seed` and `seeds` are applied on first render only.

## Injection hooks

### `useInjection(token)`

Resolves a value from the nearest container. Re-resolves when the container resets.

```tsx
import { useInjection } from '@wirestate/react';
import { CounterService } from './services';

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

emit('RESET');
emit('ADD', { amount: 5 });
```

### `useEvent(type, handler)`

Subscribes a handler to a single event type for the lifetime of the component.

```tsx
useEvent('RESET', (event) => {
  console.log(event.type, event.payload);
});
```

### `useEvents(types, handler)`

Subscribes to multiple event types with a single handler.

```tsx
useEvents(['RESET', 'CLEAR'], (event) => {
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
  await call('LOGIN', { username: 'alice' }).task;
}
```

### `useOptionalCommandCaller()`

Same as `useCommandCaller` but returns `null` if no handler is registered.

### `useCommandHandler(type, handler)`

Registers a command handler from a component for the lifetime of the component.

```tsx
useCommandHandler('SCROLL_TOP', () => {
  window.scrollTo(0, 0);
});
```

## Query hooks

### `useQueryCaller()`

Returns an async function that calls a query handler and resolves its return value.

```tsx
const query = useQueryCaller();
const items = await query('GET_ITEMS');
```

### `useSyncQueryCaller()`

Same as `useQueryCaller` but calls a synchronous handler.

### `useOptionalQueryCaller()` / `useOptionalSyncQueryCaller()`

Return `null` when no handler is registered instead of throwing.

### `useQueryHandler(type, handler)`

Registers a query handler from a component.

```tsx
useQueryHandler('GET_SCROLL_POS', () => window.scrollY);
```

## Container hooks

### `useContainer()`

Returns the nearest `Container` instance. Useful for advanced manual resolution.

### `useContainerRevision()`

Returns a counter that increments each time the container is reset. Use to trigger effects when the container changes.

### `useScope()`

Returns the current `WireScope` linked to the nearest container.

## Test utilities

```ts
import { withIocProvider } from '@wirestate/react/test-utils';
```

`withIocProvider(children, container?, seed?)` — wraps a React tree with an `IocProvider` for use in tests.

## License

MIT
