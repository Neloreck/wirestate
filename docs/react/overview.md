# React Overview

`@wirestate/react` connects Wirestate containers to a React tree.

Use it for [providers](/api/wirestate/functions/ContainerProvider), scoped containers, service injection, and
component-lifetime event, command, and query handlers.
Choose a separate reactivity package for service state.

## Install

For React with Preact Signals:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals @preact/signals-react reflect-metadata
```

For React with MobX:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx mobx mobx-react-lite reflect-metadata
```

## Root Provider

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
  const config = useMemo(() => ({ entries: [CounterService] }), []);

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

React providers provision containers from an effect. In React Strict Mode, a managed container can be created and
activated, then discarded before the committed provider lifecycle continues. Put provider-owned work in
`@OnProvision`, and clean it up in `@OnDeprovision`.

## React Package Surface

- `ContainerProvider` and `SubContainerProvider` publish containers through React context.
- `useInjection`, `useOptionalInjection`, `useContainer`, and `useScope` read from the active container.
- `useEvent`, `useEvents`, `useEventsHandler`, and `useEventEmitter` work with the event bus.
- `useCommandExecutor`, `useOptionalCommandExecutor`, and `useCommandHandler` work with the command bus.
- `useQueryExecutor`, `useAsyncQueryExecutor`, `useOptionalQueryExecutor`, `useOptionalAsyncQueryExecutor`, and
  `useQueryHandler` work with the query bus.


---

API reference: [`ContainerProvider`](/api/wirestate/functions/ContainerProvider),
[`SubContainerProvider`](/api/wirestate/functions/SubContainerProvider), [`useInjection`](/api/wirestate/functions/useInjection),
[`useCommandExecutor`](/api/wirestate/functions/useCommandExecutor), [`useQueryExecutor`](/api/wirestate/functions/useQueryExecutor).
