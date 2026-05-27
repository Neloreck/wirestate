# React Seeds

React providers pass seed data through container config.

## Root Provider Seeds

```tsx
import { ContainerProvider } from "@wirestate/react";
import { useMemo } from "react";

function ApplicationRoot() {
  const config = useMemo(
    () => ({
      seed: { locale: "en-US" },
      entries: [CounterService],
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

## Child Provider Seeds

`SubContainerProvider` accepts targeted seeds for its child container.

```tsx
import { SubContainerProvider } from "@wirestate/react";

<SubContainerProvider entries={[CartService]} seeds={[[CartService, { items: hydratedItems }]]}>
  <Cart />
</SubContainerProvider>;
```

## Read Seeds In Services

Read targeted seeds in `@OnProvision`. This applies provider-owned startup data after the React provider commits and
avoids doing provider work during activation.

```ts
import { Inject, Injectable, OnProvision, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    const seed = this.scope.getSeed<{ initialCount?: number }>(CounterService);

    if (typeof seed?.initialCount === "number") {
      this.count = seed.initialCount;
    }
  }
}
```

Changing provider seeds recreates managed provider containers when the shallow provider inputs change.


---

API reference: [`ContainerProvider`](/api/wirestate/functions/ContainerProvider),
[`SubContainerProvider`](/api/wirestate/functions/SubContainerProvider), [`SeedEntries`](/api/wirestate/type-aliases/SeedEntries),
[`WireScope`](/api/wirestate/classes/WireScope).
