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

Every Wirestate tree needs a root container (`useContainerProvision`) and, when you want subtree-local services,
a child-container provider (`useSubContainerProvider`). These hooks are applied to a Lit element that acts as the root.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  ContainerProvider,
  useContainerProvision,
} from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  public readonly containerProvider: ContainerProvider = useContainerProvision(this, {
    options: {
      entries: [CounterService],
    },
  });

  public render() {
    return html`<my-counter></my-counter>`;
  }
}
```

`useContainerProvision` creates the root container.

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
    return html`
      <button @click=${() => this.counterService.increment()}>
        Count: ${watch(this.counterService.count)}
      </button>
    `;
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
      this.count.set(seed.count);
    }
  }
}
```

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import {
  ContainerProvider,
  useContainerProvision,
} from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  public readonly container: ContainerProvider = useContainerProvision(this, {
    options: {
      entries: [CounterService],
      seeds: [[CounterService, { count: 100 }]],
    },
  });
}
```

## Events and Queries in Lit

Lit components use similar `@onEvent` / `@onQuery` / `@onCommand` decorators from `@wirestate/lit`.

```ts
import { Event } from "@wirestate/core";
import { onEvent, onQuery, onCommand } from "@wirestate/lit";

@customElement("my-logger")
export class MyLogger extends LitElement {
  @onEvent("COUNTER_INCREMENTED")
  private onCounterIncremented(event: Event<{ count: number }>): void {
    console.log("New count:", event.payload?.count);
  }

  @onQuery("GET_LABEL")
  private onGetLabel(): string {
    return "some-counter-label";
  }

  @onCommand("DUMP_LOGS")
  private onDumpLogs(): void {
    console.log("Dumping logs on command");
  }
}
```
