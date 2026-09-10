# @wirestate/mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Framework-agnostic MobX exports for Wirestate services.

Use this package to create observable services once and share them across React and Lit applications. Pair it with
`@wirestate/react-mobx` to render React components or `@wirestate/lit-mobx` to render Lit elements.

## Install

```bash
npm install @wirestate/core @wirestate/mobx
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/mobx";

@Injectable()
class CounterService {
  @Observable()
  public count = 0;

  public constructor() {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count++;
  }
}
```

Alternatively, register `ObservablePlugin` on the root container. It calls `makeObservable` for every activated
service that carries MobX decorators, so services skip the constructor call.

```ts
import { Container } from "@wirestate/core";
import { ObservablePlugin } from "@wirestate/mobx";

const container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
```

The same `CounterService` can now be consumed from a React component (via `@wirestate/react-mobx`) or a Lit element
(via `@wirestate/lit-mobx`) without changes.

## What Is Included

- Re-exports from `mobx`.
- Decorator aliases: `Observable`, `ShallowObservable`, `RefObservable`, `DeepObservable`, `Action`, `BoundAction`, and
  `Computed`.
- `ObservablePlugin`: optional shortcut that calls `makeObservable` for activated services.

## Learn More

- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-mobx/)
- [MobX docs](https://mobx.js.org/README.html)

## License

MIT
