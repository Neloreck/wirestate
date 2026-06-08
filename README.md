# Wirestate

[![docs](https://img.shields.io/badge/docs-github_pages-blue)](https://neloreck.github.io/wirestate)
[![npm](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Wirestate is a TypeScript state-management toolkit built around dependency-injected services.

Application logic lives in `@Injectable` classes. React and Lit adapters provide those services to UI trees. Reactivity
is separate: use MobX, Signals, plain values, or another state bridge inside your services.

Use Wirestate when you want service-owned state and workflows that can be scoped to an app, subtree, feature, modal,
tenant, or test.

## Core Ideas

- Services own state, workflows, and cross-component coordination.
- Containers define scope and lifetime.
- Events broadcast notifications inside a container.
- Commands run one active write handler.
- Queries run one active read handler.
- Seeds pass startup, hydration, and test data into services.
- Provider lifecycle hooks connect service work to React or Lit ownership.

## Packages

| Package                                                               | Purpose                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`@wirestate/core`](./src/wirestate-core/README.md)                   | Containers, injectable services, lifecycle, seeds, messaging.       |
| [`@wirestate/react`](./src/wirestate-react/README.md)                 | React provider, injection hooks, and component-owned handlers.      |
| [`@wirestate/lit`](./src/wirestate-lit/README.md)                     | Lit providers, decorators, controllers, and element handlers.       |
| [`@wirestate/mobx`](./src/wirestate-mobx/README.md)                   | Framework-agnostic MobX exports for shared services.                |
| [`@wirestate/react-mobx`](./src/wirestate-react-mobx/README.md)       | MobX React reactivity binding (`mobx-react-lite`).                  |
| [`@wirestate/lit-mobx`](./src/wirestate-lit-mobx/README.md)           | MobX Lit reactivity binding (`@adobe/lit-mobx`).                    |
| [`@wirestate/signals`](./src/wirestate-signals/README.md)             | Framework-agnostic Preact Signals exports for shared services.      |
| [`@wirestate/react-signals`](./src/wirestate-react-signals/README.md) | Preact Signals React reactivity binding.                            |
| [`@wirestate/lit-signals`](./src/wirestate-lit-signals/README.md)     | Preact Signals Lit reactivity binding (`@lit-labs/preact-signals`). |
| [`wirestate`](./src/wirestate/README.md)                              | Compatibility package for the unscoped package name.                |

## Install

Install the Wirestate packages for the stack you use.

```bash
# React + Signals
npm install @wirestate/core @wirestate/signals @wirestate/react @wirestate/react-signals

# React + MobX
npm install @wirestate/core @wirestate/mobx @wirestate/react @wirestate/react-mobx

# Lit + Signals
npm install @wirestate/core @wirestate/signals @wirestate/lit @wirestate/lit-signals

# Lit + MobX
npm install @wirestate/core @wirestate/mobx @wirestate/lit @wirestate/lit-mobx
```

Import `reflect-metadata` once before decorated services are loaded.

```ts
import "reflect-metadata";
```

Enable decorator metadata in TypeScript.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Example

```tsx
import { Injectable } from "@wirestate/core";
import { ContainerProvider, useInjection } from "@wirestate/react";
import { useSignals } from "@wirestate/react-signals";
import { Signal, signal } from "@wirestate/signals";

@Injectable()
class CounterService {
  public readonly count: Signal<number> = signal(0);

  public increment(): void {
    this.count.value++;
  }
}

function Counter() {
  useSignals();

  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Count: {counter.count.value}</button>;
}

export function App() {
  return (
    <ContainerProvider config={{ bindings: [CounterService] }}>
      <Counter />
    </ContainerProvider>
  );
}
```

`@wirestate/react` connects the component to the service. `useSignals()` subscribes this component to signal reads
during render. The same service pattern can use MobX or Signals in React or Lit.

## Documentation

- [Docs home](https://neloreck.github.io/wirestate/)
- [Installation](https://neloreck.github.io/wirestate/introduction/installation)
- [Core guide](https://neloreck.github.io/wirestate/core/overview)
- [React guide](https://neloreck.github.io/wirestate/react/overview)
- [Lit guide](https://neloreck.github.io/wirestate/lit/overview)
- [API reference](https://neloreck.github.io/wirestate/api/)

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docs:build
```

Build output goes to `target/`.

## License

MIT
