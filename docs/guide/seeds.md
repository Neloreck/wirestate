# Seeds (Hydration)

Seeds pass an initial state into services at container creation time.
They solve server-side rendering hydration, per-instance parameterization, and deterministic test setup without reaching for global state.

## Global Seed

A single object available to all services in the container.
Inject it via the `SEED` token or access from a `WireScope` instance.

```ts
import { Container, createIocContainer } from "@wirestate/core";

interface GlobalSeed {
  apiUrl: string;
  locale: string;
}

const container: Container = createIocContainer({
  seed: { apiUrl: "https://api.example.com", locale: "en-US" } as GlobalSeed,
});
```

### Service

```ts
import { Injectable, Inject, SEED, WireScope } from "@wirestate/core";

@Injectable()
export class ApiClient {
  public constructor(
    @Inject(SEED)
    private readonly seed: GlobalSeed,
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  // Construction time resolution:
  public get baseUrl(): string {
    return this.seed.apiUrl;
  }

  // Runtime resolution via scope:
  public get baseUrlFromScope(): string {
    return this.scope.getSeed<GlobalSeed>()!.apiUrl;
  }
}
```

### React

```tsx
import { SEED } from "@wirestate/core";
import { useInjection } from "@wirestate/react";

function SomeComponent() {
  const seed: GlobalSeed = useInjection(SEED);

  // ...
}
```

### Lit

```ts
import { SEED } from "@wirestate/core";
import { injection } from "@wirestate/lit";

@customElement("some-component")
class SomeComponent extends ReactiveElement {
  @injection(SEED)
  public seed!: GlobalSeed;

  // ...
}
```

## Per-Service Seeds

Per-service seeds scope initialization data to a specific service or by unique identifier key.
Read them via `scope.getSeed(ServiceClass)` or `scope.getSeed("SEED_KEY")`.
Returns `null` if no seed was provided for that service.

### Service

```ts
import { Injectable, Inject, OnActivated, WireScope } from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

export interface CounterSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  public count: Signal<number> = signal(0);

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  @OnActivated()
  public onActivated(): void {
    const seed = this.scope.getSeed<CounterSeed>(CounterService);

    if (typeof seed?.count === "number") {
      this.count.value = seed.count;
    }
  }
}
```

### React

```tsx
import { createInjectablesProvider, IocProvider } from "@wirestate/react";
import { CounterService } from "./CounterService";

const InjectablesProvider = createInjectablesProvider([CounterService]);

<IocProvider seed={{ apiUrl: "https://api.example.com" }}>
  <InjectablesProvider seeds={[[CounterService, { count: 42 }]]}>
    <RootPage />
  </InjectablesProvider>
</IocProvider>;
```

### Lit

```ts
@customElement("counter-page")
export class CounterPage extends LitElement {
  public readonly ioc: IocProviderController = useIocProvision(this, { seed: { apiUrl: "https://api.example.com" } });
  public readonly injectables: InjectablesProviderController = useInjectablesProvider(this, {
    entries: [CounterService],
    seeds: [[CounterService, { count: 42 }]],
    into: () => this.ioc.value,
  });
}
```
