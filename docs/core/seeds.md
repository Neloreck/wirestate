# Core Seeds

Seeds are container-scoped input data. Use them for hydration, per-instance parameters, static configuration, and
deterministic tests.

There are two kinds:

- Shared seed: one object for the whole container.
- Targeted seeds: values keyed by service class, string, or symbol.

## Shared Seed

Pass `seed` to `createContainer`. Read it with the `SEED` token or `scope.getSeed()`.

Shared seeds work well for static app or environment config that every service in the container can read.

```ts
import { Container, Inject, Injectable, SEED, createContainer } from "@wirestate/core";

interface ApplicationSeed {
  apiUrl: string;
  locale: string;
  featureFlags: ReadonlySet<string>;
}

@Injectable()
class ApiClient {
  public constructor(@Inject(SEED) private readonly seed: ApplicationSeed) {}

  public get baseUrl(): string {
    return this.seed.apiUrl;
  }
}

const container: Container = createContainer({
  seed: {
    apiUrl: "https://api.example.com",
    locale: "en-US",
    featureFlags: new Set(["cart-redesign"]),
  } satisfies ApplicationSeed,
  entries: [ApiClient],
});
```

Replace the shared seed with `applySharedSeed`.

```ts
import { applySharedSeed } from "@wirestate/core";

applySharedSeed(container, { apiUrl: "https://api.next.example.com", locale: "uk-UA" });
```

## Targeted Seeds

Targeted seeds belong to one key. They do not touch the shared seed object. Use them for service-specific startup data
or static config that should stay tied to one token.

```ts
import { Container, createContainer } from "@wirestate/core";

const container: Container = createContainer({
  seeds: [
    [CounterService, { count: 10 }],
    [ApiClient, { timeoutMs: 5_000 }],
    ["TENANT_ID", "tenant-a"],
  ],
  entries: [CounterService],
});
```

Read targeted seeds through `WireScope`. When seed application is part of provider-owned startup, apply it in
`@OnProvision`.

```ts
import { Inject, Injectable, OnProvision, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    const seed = this.scope.getSeed<{ count?: number }>(CounterService);

    if (typeof seed?.count === "number") {
      this.count = seed.count;
    }
  }
}
```

`scope.getSeed(Token)` returns `null` when no targeted seed exists. Falsy values are preserved.

If you use core without a framework adapter, call `provisionContainer` after creating the container so provider lifecycle
hooks run.

```ts
import { provisionContainer } from "@wirestate/core";

const lifecycle = new Map();

provisionContainer(container, lifecycle, [CounterService]);
```

## Updating Seeds

`applySeeds` updates targeted seeds in place. `unapplySeeds` removes targeted seeds by key.

```ts
import { applySeeds, unapplySeeds } from "@wirestate/core";

applySeeds(container, [[CounterService, { count: 50 }]]);
unapplySeeds(container, [[CounterService, null]]);
```

Seed updates do not rewind already provisioned services. Apply seeds before the provider provisions the container, or
explicitly re-apply the value in your own service method.


---

API reference: [`SEED`](/api/wirestate/variables/SEED), [`SEEDS`](/api/wirestate/variables/SEEDS),
[`applySharedSeed`](/api/wirestate/functions/applySharedSeed), [`applySeeds`](/api/wirestate/functions/applySeeds),
[`unapplySeeds`](/api/wirestate/functions/unapplySeeds), [`SeedEntries`](/api/wirestate/type-aliases/SeedEntries).
