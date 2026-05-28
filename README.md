# Wirestate

[![docs](https://img.shields.io/badge/docs-github_pages-blue)](https://neloreck.github.io/wirestate)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Wirestate is a set of TypeScript packages for building application state around dependency-injected services.

The core package provides the container model. React and Lit packages connect that model to component trees.
Reactivity is optional and lives in adapter packages or in your own service code.

Use Wirestate when application logic should live outside UI components and service lifetime should follow an app,
subtree, test, tenant, or feature scope.

What the core gives you:

- Scoped containers for root apps and child branches.
- `@Injectable` services that own state, workflows, and coordination logic.
- Activation, deactivation, provision, and deprovision hooks.
- Container-local events, commands, and queries.
- Shared and targeted seeds for hydration, tests, and startup data.

## Packages

| NPM                                                                                                                                                   | Package                                                               | Description                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| [![npm version](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)                   | [`@wirestate/core`](./src/wirestate-core/README.md)                   | Containers, services, lifecycle, messaging, seeds      |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)                 | [`@wirestate/react`](./src/wirestate-react/README.md)                 | React providers, hooks, messaging, test utilities      |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-mobx)       | [`@wirestate/react-mobx`](./src/wirestate-react-mobx/README.md)       | MobX and MobX React re-exports                         |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals) | [`@wirestate/react-signals`](./src/wirestate-react-signals/README.md) | Preact Signals for React re-exports                    |
| [![npm version](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)                     | [`@wirestate/lit`](./src/wirestate-lit/README.md)                     | Lit decorators, controllers, providers, test utilities |
| [![npm version](https://img.shields.io/npm/v/@wirestate/lit-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-signals)     | [`@wirestate/lit-signals`](./src/wirestate-lit-signals/README.md)     | Lit Signals re-exports                                 |

## Install

Import `reflect-metadata` once before decorated services are loaded.

### For React

```bash
# Core + React integration
npm install @wirestate/core @wirestate/react reflect-metadata
npm install react react-dom

# With MobX reactivity
npm install @wirestate/react-mobx mobx mobx-react-lite

# With Preact Signals reactivity
npm install @wirestate/react-signals @preact/signals-react
```

### For Lit

```bash
# Core + Lit integration
npm install @wirestate/core @wirestate/lit reflect-metadata
npm install lit @lit/context @lit/reactive-element

# With Signals reactivity
npm install @wirestate/lit-signals @lit-labs/signals signal-polyfill
```

## Examples

### React + Signals

This example stores state in a service and renders it from React with Preact Signals. Reading `.value` during render is
the React subscription point.

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

This example provides the same service from a Lit root element. `watch()` subscribes the template to signal updates.

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
  @containerProvide({ config: { bindings: [CounterService] } })
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

## Docs

- [General](https://neloreck.github.io/wirestate/)
- [API](https://neloreck.github.io/wirestate/api/modules.html)

## License

MIT
