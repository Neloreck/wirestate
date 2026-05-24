# Seeds (Hydration)

Seeds pass an initial state into services at container creation time.
They solve server-side rendering hydration, per-instance parameterization, and deterministic test setup without reaching for global state.

## Global Seed

A single object available to all services in the container.
Inject it via the `SEED` token or access from a `WireScope` instance.

```ts
import { applySharedSeed, Container, createContainer, SEED } from "@wirestate/core";

interface GlobalSeed {
  apiUrl: string;
  locale: string;
}

const container: Container = createContainer({
  seed: { apiUrl: "https://api.example.com", locale: "en-US" } as GlobalSeed,
});

applySharedSeed(container, { apiUrl: "https://api2.example.com", locale: "en-GB" });

const seed: GlobalSeed = container.get(SEED);
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
import { applySharedSeed, createContainer, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService } from "./CounterService";

const container: Container = createContainer({
  entries: [CounterService],
});

export function Application() {
  useEffect(() => {
    applySharedSeed(container, { apiUrl: "https://api.next.example.com", locale: "en-US" });
  }, []);

  return (
    <ContainerProvider container={container}>
      <RootPage />
    </ContainerProvider>
  );
}
```

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
Returns `null` if no seed was provided for that key.

```ts
import { Container, createContainer } from "@wirestate/core";

const container: Container = createContainer({
  seeds: [
    [CounterService, { count: 1000 }],
    ["SOME_KEY", "VALUE"],
  ],
});
```

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
import { applySeeds, createContainer, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { CounterService } from "./CounterService";

const container: Container = createContainer({
  seeds: [[CounterService, { count: 5 }]],
  entries: [CounterService],
});

export function Application() {
  useEffect(() => {
    applySeeds(container, [[CounterService, { count: 50 }]]);
  }, []);

  return (
    <ContainerProvider container={container}>
      <RootPage />
    </ContainerProvider>
  );
}
```

### Lit

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import {
  ContainerProvider,
  useContainerProvision,
} from "@wirestate/lit";

@customElement("counter-page")
export class CounterPage extends LitElement {
  public readonly containerProvider: ContainerProvider = useContainerProvision(this, {
    config: {
      seed: { apiUrl: "https://api.example.com" },
      seeds: [[CounterService, { count: 42 }]],
      entries: [CounterService],
      activate: [CounterService],
    },
  });
}
```
