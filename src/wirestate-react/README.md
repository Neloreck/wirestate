# @wirestate/react [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

React bindings for Wirestate containers.

Use this package to provide a Wirestate container to a React tree, inject services from components, and register
component-scoped event, command, and query handlers.

## Install

```bash
npm install @wirestate/core @wirestate/react
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

This package wires services into React. It does not make service fields reactive by itself; pair it with
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx),
[`@wirestate/react-signals`](https://www.npmjs.com/package/@wirestate/react-signals), or your own React state bridge
when components need to re-render from service changes.

## Learn More

- [React guide](https://Neloreck.github.io/wirestate/react/overview)
- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-react/)

## License

MIT
