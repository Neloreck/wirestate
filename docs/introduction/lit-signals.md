# Lit Usage

## Basic Usage

Wirestate works with Lit using decorators and controllers. Provisioning and injection are the two required steps for every feature.

### 1. Create a Service

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";
import { signal, State } from "@wirestate/lit-signals";

@Injectable()
export class CounterService {
  public count: State<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public increment(): void {
    this.count.set(this.count.get() + 1);
    this.scope.emitEvent("COUNTER_INCREMENTED", { count: this.count.get() });
  }
}
```

### 2. Provide the Container and Services

Every Wirestate tree needs an IoC container (`useIocProvision`) and controller that binds services (`useInjectablesProvider`).
These hooks are applied to a Lit element that acts as the root.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  useIocProvision,
  useInjectablesProvider,
  IocProviderController,
  InjectablesProviderController,
} from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  public readonly ioc: IocProviderController = useIocProvision(this);
  public readonly injectables: InjectablesProviderController = useInjectablesProvider(this, {
    entries: [CounterService],
    into: () => this.ioc.value,
  });

  public render() {
    return html`<my-counter></my-counter>`;
  }
}
```

`useIocProvision` creates the root container. `useInjectablesProvider` binds services into a child container and
activates them when the element connects, deactivating them on disconnect.

### 3. Inject and Use the Service

Child elements resolve services from the nearest parent container via `@injection`.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { watch } from "@lit-labs/signals";
import { injection } from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("my-counter")
export class MyCounter extends LitElement {
  @injection(CounterService)
  private counterService!: CounterService;

  public render() {
    return html` <button @click=${() => this.counter.increment()}>Count: ${watch(this.counterService.count)}</button> `;
  }
}
```

## Seed Data (Hydration)

Pass initialization data to services when the element connects. Services read seeds in `@OnActivated`.

```ts
import { Injectable, Inject, OnActivated, WireScope } from "@wirestate/core";
import { signal, State } from "@wirestate/lit-signals";

export interface CounterSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  public count: State<number> = signal(0);

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

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  useIocProvision,
  useInjectablesProvider,
  IocProviderController,
  InjectablesProviderController,
} from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  // ...

  public readonly ioc: IocProviderController = useIocProvision(this);
  public readonly injectables: InjectablesProviderController = useInjectablesProvider(this, {
    entries: [CounterService],
    seeds: [[CounterService, { count: 100 }]],
    into: () => this.ioc.value,
  });

  // ...
}
```

## Events and Queries in Lit

Lit components use similar `@onEvent` / `@onQuery` decorators as `@wirestate/core` services.

```ts
import { Event } from "@wirestate/core";
import { onEvent, onQuery, onCommand } from "@wirestate/lit";

@customElement("my-logger")
export class MyLogger extends LitElement {
  // ...

  @onEvent("COUNTER_INCREMENTED")
  private onCounterIncremented(event: Event<number>): void {
    console.log("New count:", event.payload);
  }

  @onQuery("GET_LABEL")
  private onQueryLabel(): string {
    return "some-counter-label";
  }

  @onCommand("DUMP_LOGS")
  private onQueryLabel(): void {
    console.log("Dumping logs on command");
  }

  // ...
}
```
