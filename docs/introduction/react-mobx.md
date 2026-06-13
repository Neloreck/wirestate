# React MobX

Use this stack when React components should render service state stored in MobX observables.

Use `@wirestate/mobx` for observable service state and `@wirestate/react-mobx` for React rendering. For MobX behavior
and React integration details, use the official [MobX docs](https://mobx.js.org/README.html) and
[React integration docs](https://mobx.js.org/react-integration.html).

## Install

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/react @wirestate/react-mobx
```

## Minimal Example

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

## Detailed Pages

- [React overview](/react/overview)
- [React containers](/react/containers)
- [React injection](/react/injection)
- [React MobX overview](/react-mobx/overview)
- [React events](/react/events)
- [React commands](/react/commands)
- [React queries](/react/queries)
- [React testing](/react/testing)
