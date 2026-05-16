# React MobX Usage

## Basic Usage

The core of Wirestate is the **Service** — an `@Injectable` class holding state and logic.

### Creating a Service

Services hold reactive state using MobX observables. Call `makeObservable(this)` in the constructor to activate the decorators.

```ts
import { Injectable } from "@wirestate/core";
import { Observable, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor() {
    makeObservable(this);
  }

  public increment(): void {
    this.count += 1;
  }
}
```

### Dependency Injection

Services inject other services via constructor parameters.

```ts
import { Injectable, Inject } from "@wirestate/core";
import { Observable, Action, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class LoggerService {
  public log(...args: Array<unknown>): void {
    console.log("[log]:", ...args);
  }
}

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(
    @Inject(LoggerService)
    private readonly loggerService: LoggerService
  ) {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.loggerService.log("Incrementing counter value:", this.count + 1);
    this.count += 1;
  }
}
```

Wrap state mutations in `@Action()` to batch MobX updates and keep reactions consistent.

### Providing Services

`createInjectablesProvider` creates a React component that binds services into a child IoC container. `IocProvider` provides the root container.

```tsx
import { Container, createIocContainer } from "@wirestate/core";
import { IocProvider } from "@wirestate/react";

const container: Container = createIocContainer({
  entries: [CounterService, LoggerService],
});

export function Application() {
  return (
    <IocProvider>
      <Counter />
    </IocProvider>
  );
}
```

### Consuming Services

Wrap components in `observer` so they re-render when observed properties change.

```tsx
import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";

export const Counter = observer(function () {
  const counterService: CounterService = useInjection(CounterService);

  return <button onClick={() => counterService.increment()}>count: {counterService.count}</button>;
});
```

## Advanced Patterns

### Computed Values

`@Computed()` derives a value from observables and caches it until dependencies change.

```ts
import { Injectable } from "@wirestate/core";
import { Observable, Computed, Action, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor() {
    makeObservable(this);
  }

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }

  @Action()
  public increment(): void {
    this.count += 1;
  }
}
```

```tsx
export const Counter = observer(function Counter() {
  const counterService: CounterService = useInjection(CounterService);

  return (
    <button onClick={() => counterService.increment()}>
      {counterService.count} ({counterService.isEven ? "even" : "odd"})
    </button>
  );
});
```

### Events

Events are fire-and-forget messages broadcast to all subscribers in the same container. Emit from services via `WireScope`; subscribe with `@OnEvent` in another service or `useEvent` in React.

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";
import { Observable, Action, makeObservable } from "@wirestate/react-mobx";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count += 1;
    this.scope.emitEvent("COUNT_INCREMENTED", this.count);
  }
}
```

```ts
import { Injectable, OnEvent, Event } from "@wirestate/core";

@Injectable()
export class AnalyticsService {
  @OnEvent("COUNT_INCREMENTED")
  private onCountIncremented(event: Event<number>): void {
    console.log("Track count incremented:", event.payload);
  }
}
```

Subscribe in React components:

```tsx
import { Event } from "@wirestate/core";
import { useEvent } from "@wirestate/react";

function CounterLogger() {
  useEvent("COUNT_INCREMENTED", (event: Event<number>) => {
    console.log("Component received new count:", event.payload);
  });

  return null;
}
```

### Commands

Commands are named write operations dispatched to a single registered handler. The caller gets a `CommandDescriptor` to track async completion.

```ts
import { Injectable, OnCommand } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  private async onLogout(): Promise<void> {
    await clearSession();
  }
}
```

```tsx
import { useCommandCaller, CommandCaller, CommandDescriptor } from "@wirestate/react";

function LogoutButton() {
  const callCommand: CommandCaller = useCommandCaller();

  const handleClick = async () => {
    const descriptor: CommandDescriptor = callCommand("LOGOUT");

    await descriptor.task;
  };

  return <button onClick={handleClick}>Log out</button>;
}
```

### Queries

Queries are synchronous or asynchronous request-response calls. One handler answers; callers receive the result directly.

```ts
import { Injectable, OnQuery } from "@wirestate/core";

@Injectable()
export class ThemeService {
  private theme: string = "dark";

  @OnQuery("CURRENT_THEME")
  public onQueryTheme(): string {
    return this.theme;
  }
}
```

```tsx
import { useSyncQueryCaller, SyncQueryCaller } from "@wirestate/react";
import { useCallback, useState } from "react";

function ThemeToggle() {
  const [theme, setTheme] = useState<string>("unknown");
  const query: SyncQueryCaller = useSyncQueryCaller();

  const onQueryTheme = useCallback(() => {
    setTheme(query("CURRENT_THEME"));
  }, []);

  return <button onClick={onQueryTheme}>Theme: {theme}</button>;
}
```

### Seed Data

Pass initialization data to services when the provider mounts. Read seeds in `@OnActivated` and apply them inside an `@Action()` to keep MobX updates batched.

```tsx
const container: Container = createIocContainer({
  seeds: [[CounterService, { initialCount: 10 }]],
  entries: [CounterService],
});
```

```tsx
<IocProvider container={container}>
  <Application />
</IocProvider>;
```

```ts
import { Injectable, Inject, OnActivated, WireScope } from "@wirestate/core";
import { Observable, Action, makeObservable } from "@wirestate/react-mobx";

export interface CounterSeed {
  initialCount?: number;
}

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {
    makeObservable(this);
  }

  @OnActivated()
  public onActivated(): void {
    this.initializeFromSeed();
  }

  @Action()
  private initializeFromSeed(): void {
    const seed = this.scope.getSeed<CounterSeed>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count = seed.initialCount;
    }
  }
}
```

### Testing

Services are plain classes — test them without a UI framework.

```ts
import { mockContainer } from "@wirestate/core/test-utils";

test("increments counter", () => {
  const container = mockContainer({ entries: [LoggerService, CounterService] });
  const service = container.get(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```
