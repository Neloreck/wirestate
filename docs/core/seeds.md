# Core Seeds

Seeds are input data scoped to one container. Use them for hydration, per-instance parameters, static configuration, and
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
  bindings: [ApiClient],
  seed: {
    apiUrl: "https://api.example.com",
    locale: "en-US",
    featureFlags: new Set(["cart-redesign"]),
  } satisfies ApplicationSeed,
});
```

Replace the shared seed with `setSharedSeed`.

```ts
import { setSharedSeed } from "@wirestate/core";

setSharedSeed(container, { apiUrl: "https://api.next.example.com", locale: "uk-UA" });
```

## Targeted Seeds

Targeted seeds belong to one key. They do not change the shared seed object. Use them for service-specific startup data
or static config tied to one token.

```ts
import { Container, createContainer } from "@wirestate/core";

const container: Container = createContainer({
  bindings: [CounterService],
  seeds: [
    [CounterService, { count: 10 }],
    [ApiClient, { timeoutMs: 5_000 }],
    ["TENANT_ID", "tenant-a"],
  ],
});
```

Read targeted seeds through `WireScope`. Seeds exist from container creation, so apply static seed values in
`@OnActivated`. Use that hook for cheap setup that does not need cleanup. Keep `@OnProvision` for provider-owned
resources such as timers, subscriptions, or sockets.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<{ count?: number }>(CounterService);

    if (typeof seed?.count === "number") {
      this.count = seed.count;
    }
  }
}
```

`scope.getSeed(Token)` returns `null` when no targeted seed exists. Falsy values are preserved.

`@OnActivated` runs the first time the service is resolved. Resolve or eagerly activate the service so the hook runs.

```ts
const counter = container.get(CounterService);
```

## Updating Seeds

`setSeeds` updates targeted seeds in place. `unsetSeeds` removes targeted seeds by key. The value passed to
`unsetSeeds` is ignored; only the key matters.

```ts
import { setSeeds, unsetSeeds } from "@wirestate/core";

setSeeds(container, [[CounterService, { count: 50 }]]);
unsetSeeds(container, [[CounterService, null]]);
```

Seed updates do not rewind already provisioned services. Apply seeds before a provider provisions the container, or
explicitly re-apply the value in your own service method.

## API Reference

[`SEED`](/api/wirestate-core/variables/SEED), [`SEEDS`](/api/wirestate-core/variables/SEEDS),
[`setSharedSeed`](/api/wirestate-core/functions/setSharedSeed), [`setSeeds`](/api/wirestate-core/functions/setSeeds),
[`unsetSeeds`](/api/wirestate-core/functions/unsetSeeds), [`SeedBindings`](/api/wirestate-core/type-aliases/SeedBindings).
