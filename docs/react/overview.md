# React Overview

`@wirestate/react` connects Wirestate containers to a React tree.

Use it when React components need access to a Wirestate container: a
[provider](/api/wirestate-react/functions/ContainerProvider), injection hooks, and hooks for local events, commands, and
queries.
Choose a separate reactivity package for service state.

## Install

Install the React bridge with core and MobX-backed service state:

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/react @wirestate/react-mobx
```

For React APIs and runtime behavior, use the official [React reference](https://react.dev/reference/react) and
[`react` package](https://www.npmjs.com/package/react).

This quickstart uses [React MobX](/react-mobx/overview) because `@wirestate/react` provides container access, not
automatic React rendering for plain service fields. [React Signals](/react-signals/overview) is also available.

## Root Provider

Wrap a React subtree in `ContainerProvider` to make services available to child components. Store rendered service state
in a reactive package such as MobX, then wrap components that read observable state with `observer`.

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { Action, Observable, makeObservable } from "@wirestate/mobx";
import { observer } from "@wirestate/react-mobx";
import { useMemo } from "react";

@Injectable()
class CounterService {
  @Observable()
  public count: number = 0;

  public constructor() {
    makeObservable(this);
  }

  @Action()
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

const Counter = observer(function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count}</button>;
});
```

Plain service fields still work for non-UI state, but they do not trigger React renders by themselves. Use
`@wirestate/react-mobx`, `@wirestate/react-signals`, or your own React state bridge when components need to update from
service state changes.

## Provider Lifecycle

`ContainerProvider` provisions containers from a React effect. In React Strict Mode, React may create a managed
container, discard it, then continue with another one. Put provider-owned work in `@OnProvision`, and clean it up in
`@OnDeprovision`. The core [lifecycle map](/core/lifecycle) shows where React mount, unmount, activation, and disposal
fit together.

## React Package Surface

- `ContainerProvider` publishes containers through React context.
- `useInjection` and `useContainer` read from the active container.
- To **send** messages, inject the bus — `useInjection(EventBus)`, `useInjection(CommandBus)`, `useInjection(QueryBus)` —
  and call `emit` / `execute` / `query`.
- To **subscribe**, use the lifecycle-managed hooks: `useOnEvents`, `useOnCommand`, `useOnQuery`.

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useOnEvents`](/api/wirestate-react/functions/useOnEvents),
[`useOnCommand`](/api/wirestate-react/functions/useOnCommand),
[`useOnQuery`](/api/wirestate-react/functions/useOnQuery).
