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
service that carries legacy MobX decorator annotations, so services skip the constructor call.

```ts
import { Container } from "@wirestate/core";
import { ObservablePlugin } from "@wirestate/mobx";

const container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
```

The same `CounterService` can now be consumed from a React component (via `@wirestate/react-mobx`) or a Lit element
(via `@wirestate/lit-mobx`) without changes.

## Decorator Modes

The examples above use legacy experimental decorators (`experimentalDecorators: true`), where MobX decorators only
record annotations and something has to call `makeObservable`. `ObservablePlugin` exists for that mode.

With TC39 standard decorators MobX applies annotations itself while the instance initializes. Observable fields are
declared with `accessor`, no `makeObservable` call is needed, and `ObservablePlugin` finds nothing to apply, so it is a
no-op and can be left out of the container.

```ts
import { Injectable } from "@wirestate/core";
import { Action, Computed, Observable } from "@wirestate/mobx";

@Injectable()
class CounterService {
  @Observable()
  public accessor count = 0;

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }

  @Action()
  public increment(): void {
    this.count++;
  }
}
```

The `accessor` keyword is required for observable fields in this mode: MobX rejects `@Observable()` on a plain field.
Getters and methods are declared the same way in both modes.

## What Is Included

- Re-exports from `mobx`.
- Decorator aliases: `Observable`, `ShallowObservable`, `RefObservable`, `DeepObservable`, `Action`, `BoundAction`, and
  `Computed`.
- `ObservablePlugin`: optional shortcut that calls `makeObservable` for activated services, for legacy
  experimental decorators only.

## Learn More

- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-mobx/)
- [MobX docs](https://mobx.js.org/README.html)

## License

MIT
