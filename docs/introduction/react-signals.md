# React Signals Usage

## Basic Usage

The core of Wirestate is the **Service** — an `@Injectable` class holding state and logic.

### Creating a Service

Services hold a reactive state.

```ts
import { Injectable } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

### Dependency Injection

Services inject other services via constructor parameters.

```ts
import { Injectable, Inject } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
export class LoggerService {
  public log(...args: Array<unknown>): void {
    console.log("[log]:", ...args);
  }
}

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);

  public constructor(
    @Inject(LoggerService)
    private readonly loggerService: LoggerService
  ) {}

  public increment(): void {
    this.loggerService.log("Incrementing counter value:", this.count.value + 1);
    this.count.value += 1;
  }
}
```

### Providing Services

Create application container and provided it via `IocProvider`.

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

```tsx
import { useInjection } from "@wirestate/react";

export function Counter() {
  const counterService: CounterService = useInjection(CounterService);

  return <button onClick={() => counterService.increment()}>count: {counterService.count.value}</button>;
}
```

## Advanced Patterns

### Events

Events are fire-and-forget messages broadcast to all subscribers in the same container. Emit from services via `WireScope`; subscribe with `@OnEvent` in another service or `useEvent` in React.

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public increment(): void {
    this.count.value += 1;
    this.scope.emitEvent("COUNT_INCREMENTED", this.count.value);
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

Pass initialization data to services in the container.

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
import { signal, Signal } from "@wirestate/react-signals";

export interface CounterSeed {
  initialCount?: number;
}

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<CounterSeed>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count.value = seed.initialCount;
    }
  }
}
```

### Testing

Services are plain classes — test them without a UI framework.

```ts
import { mockContainer, mockService } from "@wirestate/core/test-utils";

test("increments counter", () => {
  const container = mockContainer({ entries: [LoggerService, CounterService] });
  const service = container.get(CounterService);

  service.increment();

  expect(service.count.value).toBe(1);
});
```
