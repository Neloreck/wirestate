# @wirestate/react-mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

MobX exports for Wirestate React services.

Use this package when service state should be observable with MobX and React components should render through
`mobx-react-lite`.

## Install

```bash
npm install @wirestate/react-mobx mobx mobx-react-lite
```

For a full Wirestate React app:

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx react mobx mobx-react-lite reflect-metadata
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable, observer } from "@wirestate/react-mobx";

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

## What Is Included

- Re-exports from `mobx`.
- Re-exports from `mobx-react-lite`.
- Decorator aliases: `Observable`, `ShallowObservable`, `RefObservable`, `DeepObservable`, `Action`, `BoundAction`, and
  `Computed`.

## Learn More

- [React MobX guide](https://neloreck.github.io/wirestate/react-mobx/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-react-mobx/)
- [MobX docs](https://mobx.js.org/README.html)

## License

MIT
