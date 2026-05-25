# Seeds

Seeds are startup data for a container. Use them for SSR hydration, per-instance parameters, and deterministic tests.

There are two kinds:

- Shared seed: one object for the whole container.
- Targeted seeds: values keyed by service class, string, or symbol.

## Shared Seed

Pass `seed` to `createContainer`. Read it with the `SEED` token or `scope.getSeed()`.

```ts
import { Container, Inject, Injectable, SEED, createContainer } from "@wirestate/core";

interface AppSeed {
  apiUrl: string;
  locale: string;
}

@Injectable()
class ApiClient {
  public constructor(@Inject(SEED) private readonly seed: AppSeed) {}

  public get baseUrl(): string {
    return this.seed.apiUrl;
  }
}

const container: Container = createContainer({
  seed: { apiUrl: "https://api.example.com", locale: "en-US" } satisfies AppSeed,
  entries: [ApiClient],
});
```

Replace the shared seed with `applySharedSeed`.

```ts
import { applySharedSeed } from "@wirestate/core";

applySharedSeed(container, { apiUrl: "https://api.next.example.com", locale: "uk-UA" });
```

## Targeted Seeds

Targeted seeds belong to one key. They do not touch the shared seed object.

```ts
import { Container, createContainer } from "@wirestate/core";

const container: Container = createContainer({
  seeds: [
    [CounterService, { count: 10 }],
    ["TENANT_ID", "tenant-a"],
  ],
  entries: [CounterService],
});
```

Read them through `WireScope`.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

interface CounterSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  public readonly count: Signal<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<CounterSeed>(CounterService);

    if (typeof seed?.count === "number") {
      this.count.value = seed.count;
    }
  }
}
```

`scope.getSeed(Token)` returns `null` when no targeted seed exists. Falsy values are real values and stay preserved.

## Provider Seeds

React child containers can receive targeted seeds per subtree.

```tsx
import { SubContainerProvider } from "@wirestate/react";

<SubContainerProvider entries={[CartService]} seeds={[[CartService, { items: hydratedItems }]]}>
  <Cart />
</SubContainerProvider>;
```

Lit managed providers accept `seed` and `seeds` inside config.

```ts
import { LitElement } from "lit";
import { ContainerProvider, useContainerProvision } from "@wirestate/lit";

export class CounterRoot extends LitElement {
  public readonly provider: ContainerProvider = useContainerProvision(this, {
    config: {
      seed: { locale: "en-US" },
      seeds: [[CounterService, { count: 42 }]],
      entries: [CounterService],
    },
  });
}
```

## Updating Seeds

`applySeeds` updates targeted seeds in place. `unapplySeeds` removes targeted seeds by key.

```ts
import { applySeeds, unapplySeeds } from "@wirestate/core";

applySeeds(container, [[CounterService, { count: 50 }]]);
unapplySeeds(container, [[CounterService, null]]);
```

Seed updates do not rewind already-activated services. If a service reads seeds in `@OnActivated`, apply the seed before resolving the service.
