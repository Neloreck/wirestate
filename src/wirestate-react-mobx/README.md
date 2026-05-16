# @wirestate/react-mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Re-exports MobX and `mobx-react-lite`, plus class decorator wrappers compatible with TypeScript's legacy decorators.

## Installation

```bash
npm install @wirestate/react-mobx mobx mobx-react-lite
```

## Usage

```ts
import { makeObservable, observer, Observable, ShallowObservable, Action, Computed } from "@wirestate/react-mobx";
```

## Decorator wrappers

| Export                | Wraps                |
| --------------------- | -------------------- |
| `Observable()`        | `observable`         |
| `ShallowObservable()` | `observable.shallow` |
| `RefObservable()`     | `observable.ref`     |
| `DeepObservable()`    | `observable.deep`    |
| `Action()`            | `action`             |
| `Computed()`          | `computed`           |

Example:

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";
import { makeObservable, Observable, Action } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count = 0;

  public constructor(@Inject(WireScope) private scope: WireScope) {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count++;
  }
}
```

## License

MIT
