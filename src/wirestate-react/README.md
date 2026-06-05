# @wirestate/react [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

React bindings for Wirestate containers.

Use this package to provide a Wirestate container to a React tree, inject services from components, and register
component-scoped event, command, and query handlers.

## Install

```bash
npm install @wirestate/core @wirestate/react react reflect-metadata
```

## Start

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";

@Injectable()
class CounterService {
  public count = 0;
}

function CounterView() {
  const counter = useInjection(CounterService);

  return <span>{counter.count}</span>;
}

export function Application() {
  return (
    <ContainerProvider config={{ bindings: [CounterService] }}>
      <CounterView />
    </ContainerProvider>
  );
}
```

## What Is Included

- `ContainerProvider`, `useContainer`, and `useScope`.
- `useInjection` and `useOptionalInjection`.
- Event hooks: `useEventEmitter`, `useEvent`, `useEvents`, and `useAllEvents`.
- Command hooks and query hooks for executors and component-owned handlers.

This package wires services into React. It does not make service fields reactive by itself; pair it with
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx),
[`@wirestate/react-signals`](https://www.npmjs.com/package/@wirestate/react-signals), or your own React state bridge
when components need to re-render from service changes.

## Learn More

- [React guide](https://neloreck.github.io/wirestate/react/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-react/)

## License

MIT
