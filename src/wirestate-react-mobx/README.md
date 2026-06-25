# @wirestate/react-mobx [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/react-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-mobx)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

MobX React reactivity binding for Wirestate React services.

Use this package together with [`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx): create observable
service state with `@wirestate/mobx`, then render React components through `mobx-react-lite`.

## Install

```bash
npm install @wirestate/core @wirestate/react @wirestate/mobx @wirestate/react-mobx
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

```tsx
import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";

export const Counter = observer(() => {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>{counter.count}</button>;
});
```

## What Is Included

- Re-exports from `mobx-react-lite` (`observer`, `Observer`, `useObserver`, `useLocalObservable`, and related helpers).
  `mobx-react-lite` ships as a bundled dependency, so you do not install it directly.

Observable definitions and decorator aliases (`Observable`, `Action`, `Computed`, and others) live in
[`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx).

## Learn More

- [React MobX guide](https://Neloreck.github.io/wirestate/react-mobx/overview)
- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-react-mobx/)
- [MobX React docs](https://mobx.js.org/react-integration.html)

## License

MIT
