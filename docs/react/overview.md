# React Overview

`@wirestate/react` connects Wirestate containers to a React tree.

Use it when React components need access to a Wirestate container. It provides a
[provider](/api/wirestate-react/functions/ContainerProvider), injection hooks, and hooks for local events, commands,
and queries.
Choose a separate reactivity package for service state.

## Install

Install the React bridge with core:

```bash
npm install @wirestate/core @wirestate/react reflect-metadata
```

For React APIs and runtime behavior, use the official [React reference](https://react.dev/reference/react) and
[`react` package](https://www.npmjs.com/package/react).

For reactive service state, use a separate package such as [React Signals](/react-signals/overview) or
[React MobX](/react-mobx/overview).

## Root Provider

Wrap a React subtree in `ContainerProvider` to make services available to child components.

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { useMemo } from "react";

@Injectable()
class CounterService {
  public count: number = 0;

  public increment(): void {
    this.count += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ bindings: [CounterService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count}</button>;
}
```

Plain fields do not trigger React renders by themselves. Use `@wirestate/react-signals`, `@wirestate/react-mobx`, or
your own update mechanism for reactive UI state.

## Provider Lifecycle

`ContainerProvider` provisions containers from a React effect. In React Strict Mode, React may create a managed
container, discard it, then continue with another one. Put provider-owned work in `@OnProvision`, and clean it up in
`@OnDeprovision`.

## React Package Surface

- `ContainerProvider` publishes containers through React context.
- `useInjection`, `useOptionalInjection`, `useContainer`, and `useScope` read from the active container.
- `useEvent`, `useEvents`, `useAllEvents`, and `useEventEmitter` work with the event bus.
- `useCommandExecutor`, `useAsyncCommandExecutor`, `useOptionalCommandExecutor`,
  `useOptionalAsyncCommandExecutor`, and `useCommandHandler` work with the command bus.
- `useQueryExecutor`, `useAsyncQueryExecutor`, `useOptionalQueryExecutor`, `useOptionalAsyncQueryExecutor`, and
  `useQueryHandler` work with the query bus.

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useCommandExecutor`](/api/wirestate-react/functions/useCommandExecutor), [`useQueryExecutor`](/api/wirestate-react/functions/useQueryExecutor).
