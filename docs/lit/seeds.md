# Lit Seeds

Lit managed providers accept seed data inside provider config. There are two keys:

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

## Sub-Container Provider Seeds

```ts
import { SubContainerProvider, provideSubContainer } from "@wirestate/lit";

class CheckoutScope extends LitElement {
  @provideSubContainer({
    config: {
      bindings: [CartService],
      seeds: [[CartService, { items: hydratedItems }]],
    },
  })
  private provider!: SubContainerProvider;
}
```

## Read Seeds In Services

Read static targeted seeds in `@OnActivated`. Seeds exist from container creation, so applying them is cheap
resolution-time work with no cleanup. Keep `@OnProvision` for provider-owned resources such as timers, subscriptions,
or sockets.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { State, signal } from "@wirestate/lit-signals";

@Injectable()
export class CounterService {
  public readonly count: State<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ count?: number }>(CounterService);

    if (typeof seed?.count === "number") {
      this.count.set(seed.count);
    }
  }
}
```

Managed Lit containers are recreated when their provider config is replaced and when disconnected elements reconnect.

## API Reference

[`provideContainer`](/api/wirestate-lit/functions/provideContainer),
[`provideSubContainer`](/api/wirestate-lit/functions/provideSubContainer), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`SeedBindings`](/api/wirestate-core/type-aliases/SeedBindings).
