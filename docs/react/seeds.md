# React Seeds

React providers pass seed data through container config. There are two keys:

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

## Read Seeds In Services

Read static targeted seeds in `@OnActivated`. Seed values are already bound before service activation, and activation is
the right lifecycle for cheap resolution-time initialization that does not need cleanup. Keep `@OnProvision` for
provider-owned work such as subscriptions, timers, sockets, or async resources.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ initialCount?: number }>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count = seed.initialCount;
    }
  }
}
```

Changing provider seeds recreates managed provider containers when the shallow provider inputs change.

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`SeedBindings`](/api/wirestate-core/type-aliases/SeedBindings), [`WireScope`](/api/wirestate-core/classes/WireScope).
