# React MobX

Use `@wirestate/react-mobx` when React services should store MobX state.

The package re-exports MobX and `mobx-react-lite`, plus decorator aliases such as `Observable`, `Action`, and
`Computed`.

## Install

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx mobx mobx-react-lite reflect-metadata
```

## Service

MobX decorators need `makeObservable(this)`.

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
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
```

## Component

Wrap components that read observable state with `observer`.

```tsx
import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { CounterService } from "./CounterService";

export const Counter = observer(function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count}</button>;
});
```

## Computed Values

```ts
import { Injectable } from "@wirestate/core";
import { Computed, Observable, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 10;

  public constructor() {
    makeObservable(this);
  }

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }
}
```

## API Reference

[`Observable`](/api/wirestate-react-mobx/functions/Observable), [`Action`](/api/wirestate-react-mobx/functions/Action),
[`Computed`](/api/wirestate-react-mobx/functions/Computed), [`makeObservable`](/api/wirestate-react-mobx/functions/makeObservable),
[`observer`](/api/wirestate-react-mobx/functions/observer).
