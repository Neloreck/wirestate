# React Signals

Use `@wirestate/react` for containers and hooks. Use `@wirestate/react-signals` for Preact Signals re-exports.

## Service

```ts
import { Injectable } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}
```

## Dependencies

```ts
import { Inject, Injectable } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
export class LoggerService {
  public log(...args: Array<unknown>): void {
    console.log("[log]", ...args);
  }
}

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public constructor(@Inject(LoggerService) private readonly logger: LoggerService) {}

  public increment(): void {
    this.logger.log("increment", this.count.value + 1);
    this.count.value += 1;
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

Signals re-render React consumers when read during render.

```tsx
import { useInjection } from "@wirestate/react";
import { CounterService } from "./CounterService";

export function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count.value}</button>;
}
```

## Events

```ts
import { Event, Inject, Injectable, OnEvent, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public increment(): void {
    this.scope.emitEvent("COUNT_INCREMENTED", 1);
  }
}

@Injectable()
export class AnalyticsService {
  @OnEvent("COUNT_INCREMENTED")
  public track(event: Event<number>): void {
    console.log("count changed", event.payload);
  }
}
```

## Commands

```ts
import { Injectable, OnCommand } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async onLogout(): Promise<void> {
    await clearSession();
  }
}
```

```tsx
import { useCommandExecutor } from "@wirestate/react";

function LogoutButton() {
  const command = useCommandExecutor();

  return <button onClick={() => void command("LOGOUT").task}>Log out</button>;
}
```

## Queries

```ts
import { Injectable, OnQuery } from "@wirestate/core";

@Injectable()
export class ThemeService {
  @OnQuery("CURRENT_THEME")
  public onQueryTheme(): string {
    return "dark";
  }
}
```

```tsx
import { useQueryExecutor } from "@wirestate/react";

function ThemeButton() {
  const query = useQueryExecutor();

  return <button>Theme: {query<string>("CURRENT_THEME")}</button>;
}
```

## Seeds

```tsx
const config = useMemo(
  () => ({
    entries: [CounterService],
    seeds: [[CounterService, { initialCount: 10 }]],
  }),
  []
);
```

```tsx
<ContainerProvider config={config}>
  <Application />
</ContainerProvider>
```

Read targeted seeds in `@OnActivated`.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ initialCount?: number }>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count.value = seed.initialCount;
    }
  }
}
```
