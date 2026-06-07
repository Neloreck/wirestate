# React MobX

Use this stack when React components should render service state stored in MobX observables.

Use the official [MobX docs](https://mobx.js.org/README.html),
[React integration docs](https://mobx.js.org/react-integration.html), and
[`mobx`](https://www.npmjs.com/package/mobx) and
[`mobx-react-lite`](https://www.npmjs.com/package/mobx-react-lite) packages for MobX API details.

## Install

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx react mobx mobx-react-lite reflect-metadata
```

## Minimal Example

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { Action, Observable, makeObservable, observer } from "@wirestate/react-mobx";
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
- [React seeds](/react/seeds)
- [React testing](/react/testing)
