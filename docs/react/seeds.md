# React Seeds

React providers pass startup and hydration data through container config. There are two seed keys:

- `seed`: one shared object for the whole container, read with `scope.getSeed()`.
- `seeds`: values keyed by token, read with `scope.getSeed(Token)`.

See [Core seeds](/core/seeds) for the full model.

## Root Provider Seeds

```tsx
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";

function ApplicationRoot() {
  const config = useMemo(
    () => ({
      bindings: [CounterService],
      seed: { locale: "en-US" },
      seeds: [[CounterService, { initialCount: 10 }]],
    }),
    []
  );

  return (
    <ContainerProvider config={config}>
      <Application />
    </ContainerProvider>
  );
}
```

## Read Seeds in Services

Read static targeted seeds in `@OnActivated`. Seed values are bound before service activation. Use this lifecycle for
cheap initialization that does not need cleanup. Keep `@OnProvision` for provider-owned work such as subscriptions,
timers, sockets, or async resources.

```ts
import { Injectable, OnActivated, WireScope, inject } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;

  public constructor(private readonly scope: WireScope = inject(WireScope)) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ initialCount?: number }>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count = seed.initialCount;
    }
  }
}
```

Changing provider seeds recreates managed containers when the shallow provider inputs change.

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`SeedBindings`](/api/wirestate-core/type-aliases/SeedBindings), [`WireScope`](/api/wirestate-core/classes/WireScope).
