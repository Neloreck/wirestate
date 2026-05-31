# About Wirestate

Wirestate is a foundation for DI-backed TypeScript application architecture.

It provides reusable building blocks for UI frameworks: scoped ownership, injectable services, lifecycle management,
local messaging, and hydration data.

Application logic lives in services, which UI adapters provide to component trees. Services communicate through
container-local events, commands, and queries instead of reaching across UI boundaries.

Reactivity stays outside the core. Use MobX, Preact Signals, Lit Signals, or other solutions.

## What It Gives You

- Scoped containers for apps, subtrees, tests, tenants, modals, and feature areas.
- `@Injectable` services for state, workflows, and shared application logic.
- Lifecycle hooks for setup, cleanup, and provider boundaries.
- Container-local `EventBus`, `CommandBus`, and `QueryBus`.
- Seeds for SSR hydration, deterministic tests, and subtree startup data.
- React and Lit adapters for connecting services to UI trees.

## When It Fits

Use Wirestate when a feature has application logic, state, or workflows that should live outside UI components.

It is a good fit when you need:

- Services scoped to an app, subtree, modal, tenant, or test.
- Logic that can be tested without rendering UI.
- Clear boundaries between UI components and application services.

## Docs Layout

- [Core](/core/overview) covers framework-agnostic services, containers, lifecycle, messaging, seeds, and tests.
- [React](/react/overview) covers React providers, hooks, messaging, seeds, and tests.
- [Lit](/lit/overview) covers Lit providers, decorators, controllers, messaging, seeds, and tests.
- [React Signals](/react-signals/overview), [React MobX](/react-mobx/overview), and
  [Lit Signals](/lit-signals/overview) cover framework-specific reactivity packages.

## Examples

### React + Signals

Signal reads in render are the React subscription point. Create signals in services or stable component state.

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { signal, Signal } from "@wirestate/react-signals";
import { useMemo } from "react";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value += 1;
  }
}

export function Application() {
  const config = useMemo(() => ({ bindings: [CounterService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

function Counter() {
  const counterService = useInjection(CounterService);

  return <button onClick={() => counterService.increment()}>Count: {counterService.count.value}</button>;
}
```

### React + MobX

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { Action, Observable, makeObservable, observer } from "@wirestate/react-mobx";
import { useMemo } from "react";

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
  const config = useMemo(() => ({ bindings: [CounterService] }), []);

  return (
    <ContainerProvider config={config}>
      <Counter />
    </ContainerProvider>
  );
}

const Counter = observer(function Counter() {
  const counterService = useInjection(CounterService);

  return <button onClick={() => counterService.increment()}>Count: {counterService.count}</button>;
});
```

### Lit + Signals

Use `watch()` in templates to subscribe rendering to signal updates. Create signals in services or stable element state.

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, provideContainer, injection } from "@wirestate/lit";
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
  @provideContainer({ config: { bindings: [CounterService] } })
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
      <button @click=${() => this.counterService.increment()}>Count: ${watch(this.counterService.count)}</button>
    `;
  }
}
```
