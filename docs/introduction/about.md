# About Wirestate

Wirestate is a foundation for DI-backed TypeScript application architecture.

It gives a UI framework layer the pieces it needs but should not invent every time: scoped ownership, injectable
services, lifecycle, local messaging, and hydration data.

Application logic lives in services. React and Lit adapters provide those services to component trees. Services talk
through container-local events, commands, and queries instead of reaching across UI boundaries.

Reactivity stays outside the core. Use MobX, Preact Signals, Lit Signals, or plain TypeScript.

## What It Gives You

- Scoped containers for root apps, subtrees, tests, tenants, modals, and feature branches.
- `@Injectable` services as state owners and workflow owners.
- Lifecycle hooks for setup, cleanup, provider attach, and provider detach.
- Container-local `EventBus`, `CommandBus`, and `QueryBus`.
- Seeds for SSR hydration, deterministic tests, and per-subtree startup data.
- React and Lit adapters that keep framework glue thin.

## When It Fits

- You want application logic outside React or Lit components.
- You want service lifetime scoped to a container or subtree.
- You want testable services without rendering UI.
- You want DI without making the core pick a reactivity library.

Wirestate fits complex applications where a page grows into a long-lived feature with its own state, workflows,
and service boundaries.

## Examples

### React + Signals

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { signal, Signal } from "@wirestate/react-signals";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ entries: [CounterService] }));

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

function Counter() {
  const counterService = useInjection(CounterService);

  return (
    <button onClick={() => counterService.increment()}>
      Count: {counterService.count.value}
    </button>
  );
}
```

### React + MobX

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import {
  Action,
  Observable,
  makeObservable,
  observer,
} from "@wirestate/react-mobx";

@Injectable()
class CounterService {
  @Observable()
  public count: number = 0;

  public constructor() {
    makeObservable(this);
  }

  @Action()
  public increment(): void {
    this.count += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ entries: [CounterService] }));

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

const Counter = observer(function Counter() {
  const counterService = useInjection(CounterService);

  return (
    <button onClick={() => counterService.increment()}>
      Count: {counterService.count}
    </button>
  );
});
```

### Lit + Signals

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, containerProvide, injection } from "@wirestate/lit";
import { signal, State, watch } from "@wirestate/lit-signals";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@Injectable()
class CounterService {
  public readonly count: State<number> = signal(0);

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }
}

@customElement("counter-application")
class CounterApplication extends LitElement {
  @containerProvide({ config: { entries: [CounterService] } })
  private containerProvider!: ContainerProvider;

  protected render() {
    return html`<counter-button></counter-button>`;
  }
}

@customElement("counter-button")
class CounterButton extends LitElement {
  @injection(CounterService)
  private counterService!: CounterService;

  protected render() {
    return html`
      <button @click=${() => this.counterService.increment()}>
        Count: ${watch(this.counterService.count)}
      </button>
    `;
  }
}
```
