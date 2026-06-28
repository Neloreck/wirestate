# React MobX

Use `@wirestate/react-mobx` when React components should render MobX state held by services.

Observable state is defined with `@wirestate/mobx`, which re-exports MobX and provides decorator aliases such as
`Observable`, `Action`, `BoundAction`, and `Computed`. React rendering is wired through `@wirestate/react-mobx`.

For MobX behavior and React integration details, use the official [MobX docs](https://mobx.js.org/README.html) and
[React integration docs](https://mobx.js.org/react-integration.html).

## Install

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/react @wirestate/react-mobx
```

## Service

MobX decorators need `makeObservable(this)`.

```ts
import { Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/mobx";

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
import { Computed, Observable, makeObservable } from "@wirestate/mobx";

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

[`Observable`](/api/wirestate-mobx/functions/Observable), [`Action`](/api/wirestate-mobx/functions/Action),
[`BoundAction`](/api/wirestate-mobx/functions/BoundAction), [`Computed`](/api/wirestate-mobx/functions/Computed),
[`makeObservable`](/api/wirestate-mobx/functions/makeObservable),
[`observer`](/api/wirestate-react-mobx/functions/observer).

## See Also

- [React guide](/react/overview): providers, injection hooks, and component-owned handlers.
- [React MobX introduction](/introduction/react-mobx): install and a minimal example.
