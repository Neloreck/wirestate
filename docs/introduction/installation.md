# Installation

Install the core package, your UI framework, one UI adapter, and the reactivity package you use.

## Packages

| Stack           | Packages                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React + Signals | `@wirestate/core` `@wirestate/react` `@wirestate/react-signals` `react` `@preact/signals-react` `reflect-metadata`                                                |
| React + MobX    | `@wirestate/core` `@wirestate/react` `@wirestate/react-mobx` `react` `mobx` `mobx-react-lite` `reflect-metadata`                                                  |
| Lit + Signals   | `@wirestate/core` `@wirestate/lit` `@wirestate/lit-signals` `lit` `@lit/context` `@lit/reactive-element` `@lit-labs/signals` `signal-polyfill` `reflect-metadata` |

External framework and reactivity details live in the official docs for [React](https://react.dev/reference/react),
[Lit](https://lit.dev/docs/), [Preact Signals](https://preactjs.com/guide/v10/signals),
[MobX](https://mobx.js.org/README.html), and [Lit Signals](https://lit.dev/docs/data/signals/).

### React + Signals

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals react @preact/signals-react reflect-metadata
```

### React + MobX

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx react mobx mobx-react-lite reflect-metadata
```

### Lit + Signals

```bash
npm install @wirestate/core @wirestate/lit @wirestate/lit-signals lit @lit/context @lit/reactive-element @lit-labs/signals signal-polyfill reflect-metadata
```

## Runtime Import

Import `reflect-metadata` once, before decorated services are loaded.

```ts
import "reflect-metadata";
```

React Signals users should also configure the Preact Signals React transform or call `useSignals()` in components that
read signal values during render. See [React Signals](/react-signals/overview) for that setup.

## TypeScript

Enable decorator metadata.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Next Steps

- Start with [Core overview](/core/overview) for services and containers.
- Use [React overview](/react/overview) for React applications.
- Use [Lit overview](/lit/overview) for Lit applications.
- Use [React Signals](/react-signals/overview), [React MobX](/react-mobx/overview), or
  [Lit Signals](/lit-signals/overview) for framework-specific reactivity packages.
