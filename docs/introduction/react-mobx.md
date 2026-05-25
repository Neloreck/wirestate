# React MobX

Use `@wirestate/react` for containers and hooks. Use `@wirestate/react-mobx` for MobX and `mobx-react-lite` re-exports.

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

## Dependencies

```ts
import { Inject, Injectable } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class LoggerService {
  public log(...args: Array<unknown>): void {
    console.log("[log]", ...args);
  }
}

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(@Inject(LoggerService) private readonly logger: LoggerService) {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.logger.log("increment", this.count + 1);
    this.count += 1;
  }
}
```

## Provider

```tsx
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";
import { CounterService, LoggerService } from "./services";

export function Application() {
  const config = useMemo(() => ({ entries: [CounterService, LoggerService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
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
import { Computed } from "@wirestate/react-mobx";

@Injectable()
export class CounterSErvice {
  public count: number = 10;

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }
}
```

## Messaging

Events, commands, and queries are the same as the Signals guide. Reactivity does not change the bus model.

```ts
import { Inject, Injectable, OnCommand, OnQuery, WireScope } from "@wirestate/core";

@Injectable()
export class AuthService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnCommand("LOGOUT")
  public async onLogout(): Promise<void> {
    await clearSession();
  }

  @OnQuery("CURRENT_USER")
  public onQueryCurrentUser(): User | null {
    return this.scope.queryOptionalData<User>("SESSION_USER");
  }
}
```

## Seeds

Read seed data in `@OnActivated`. Mutate observables inside an action.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { Action, Observable, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {
    makeObservable(this);
  }

  @OnActivated()
  public onActivated(): void {
    this.applySeed();
  }

  @Action()
  private applySeed(): void {
    const seed = this.scope.getSeed<{ initialCount?: number }>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count = seed.initialCount;
    }
  }
}
```

```tsx
import { useMemo } from "react";

const config = useMemo(() => ({
  entries: [CounterService],
  seeds: [[CounterService, { initialCount: 10 }]],
}), [])
```

```tsx
<ContainerProvider
  config={config}
>
  <Application />
</ContainerProvider>
```
