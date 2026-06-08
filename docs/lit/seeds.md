# Lit Seeds

Lit managed providers accept startup and hydration data inside provider config. There are two seed keys:

- `seed`: one shared object for the whole container, read with `scope.getSeed()`.
- `seeds`: values keyed by token, read with `scope.getSeed(Token)`.

See [Core seeds](/core/seeds) for the full model.

## Root Provider Seeds

```ts
import { ContainerProvider, provideContainer } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("counter-root")
export class CounterRoot extends LitElement {
  @provideContainer({
    config: {
      bindings: [CounterService],
      seed: { locale: "en-US" },
      seeds: [[CounterService, { count: 100 }]],
    },
  })
  private provider!: ContainerProvider;
}
```

## Read Seeds in Services

Read static targeted seeds in `@OnActivated`. Seeds exist from container creation, so use that hook for cheap setup that
does not need cleanup. Keep `@OnProvision` for provider-owned resources such as timers, subscriptions, or sockets.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ count?: number }>(CounterService);

    if (typeof seed?.count === "number") {
      this.count.value = seed.count;
    }
  }
}
```

Managed Lit containers are recreated when their provider config is replaced and when disconnected elements reconnect.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`WireScope`](/api/wirestate-core/classes/WireScope),
[`SeedBindings`](/api/wirestate-core/type-aliases/SeedBindings).
