# Lit Seeds

Lit managed providers accept shared and targeted seed data inside provider config.

## Root Provider Seeds

```ts
import { ContainerProvider, containerProvide } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("counter-root")
export class CounterRoot extends LitElement {
  @containerProvide({
    config: {
      seed: { locale: "en-US" },
      entries: [CounterService],
      seeds: [[CounterService, { count: 100 }]],
    },
  })
  private provider!: ContainerProvider;
}
```

## Child Provider Seeds

```ts
import { SubContainerProvider, subContainerProvide } from "@wirestate/lit";

class CheckoutScope extends LitElement {
  @subContainerProvide({
    config: {
      entries: [CartService],
      seeds: [[CartService, { items: hydratedItems }]],
    },
  })
  private provider!: SubContainerProvider;
}
```

## Read Seeds In Services

Read targeted seeds in `@OnProvision`. This applies provider-owned startup data while the Lit provider owns the
container.

```ts
import { Inject, Injectable, OnProvision, WireScope } from "@wirestate/core";
import { State, signal } from "@wirestate/lit-signals";

@Injectable()
export class CounterService {
  public readonly count: State<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    const seed = this.scope.getSeed<{ count?: number }>(CounterService);

    if (typeof seed?.count === "number") {
      this.count.set(seed.count);
    }
  }
}
```

Managed Lit containers are recreated when their provider config is replaced and when disconnected elements reconnect.


---

API reference: [`containerProvide`](/api/wirestate-lit/functions/containerProvide),
[`subContainerProvide`](/api/wirestate-lit/functions/subContainerProvide), [`WireScope`](/api/wirestate/classes/WireScope),
[`SeedEntries`](/api/wirestate/type-aliases/SeedEntries).
