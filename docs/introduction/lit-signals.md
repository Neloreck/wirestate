# Lit Signals

Use `@wirestate/lit` for context, decorators, and controllers. Use `@wirestate/lit-signals` for Lit Signals re-exports.

## Service

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";
import { signal, State } from "@wirestate/lit-signals";

@Injectable()
export class CounterService {
  public readonly count: State<number> = signal(0);

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public increment(): void {
    this.count.set(this.count.get() + 1);
    this.scope.emitEvent("COUNTER_INCREMENTED", { count: this.count.get() });
  }
}
```

## Root Provider

Create a root container on a Lit host.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ContainerProvider, containerProvide } from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("application-root")
export class ApplicationRoot extends LitElement {
  @containerProvide({
    config: {
      entries: [CounterService],
    },
  })
  private provider!: ContainerProvider;

  public render() {
    return html`<my-counter></my-counter>`;
  }
}
```

Managed Lit containers are created on connect and disposed on disconnect. Entries activate by default.

## Injection

Child elements resolve services from the nearest container context.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { watch } from "@lit-labs/signals";
import { injection } from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("my-counter")
export class MyCounter extends LitElement {
  @injection(CounterService)
  private counter!: CounterService;

  public render() {
    return html` <button @click=${() => this.counter.increment()}>Count: ${watch(this.counter.count)}</button> `;
  }
}
```

## Seeds

Pass startup data through provider config.

```ts
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { ContainerProvider, containerProvide } from "@wirestate/lit";

@customElement("counter-root")
export class CounterRoot extends LitElement {
  @containerProvide({
    config: {
      entries: [CounterService],
      seeds: [[CounterService, { count: 100 }]],
    },
  })
  private provider!: ContainerProvider;
}
```

Read it in the service.

```ts
import { Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { signal, State } from "@wirestate/lit-signals";

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

## Events, Commands, Queries

Lit components can register handlers with decorators or controllers.

```ts
import { Event } from "@wirestate/core";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { injection, onCommand, onEvent, onQuery } from "@wirestate/lit";
import { CounterService } from "./CounterService";

@customElement("counter-tools")
export class CounterTools extends LitElement {
  @injection(CounterService)
  private counter!: CounterService;

  @onEvent("COUNTER_INCREMENTED")
  private onCounterIncremented(event: Event<{ count: number }>): void {
    console.log(event.payload?.count);
  }

  @onCommand("INCREMENT_COUNTER")
  private increment(): void {
    this.counter.increment();
  }

  @onQuery("COUNTER_LABEL")
  private label(): string {
    return "Counter";
  }
}
```

`CounterTools` owns the handlers. `CounterPanel` calls them through the same container scope.

```ts
import { WireScope } from "@wirestate/core";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { injection } from "@wirestate/lit";
import "./CounterTools";

@customElement("counter-panel")
export class CounterPanel extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private label: string = "Unknown";

  private emitCounterEvent(): void {
    this.scope.emitEvent("COUNTER_INCREMENTED", { count: 0 }, { from: this });
  }

  private incrementViaCommand(): void {
    void this.scope.executeCommand("INCREMENT_COUNTER").task;
  }

  private readLabel(): void {
    this.label = this.scope.queryData<string>("COUNTER_LABEL");
  }

  public render() {
    return html`
      <counter-tools></counter-tools>
      <span>${this.label}</span>
      <button @click=${() => this.emitCounterEvent()}>Emit event</button>
      <button @click=${() => this.incrementViaCommand()}>Run command</button>
      <button @click=${() => this.readLabel()}>Run query</button>
    `;
  }
}
```

Handlers follow the active container context. If a parent provider changes, Lit controllers unregister from the old bus and register on the new one.
