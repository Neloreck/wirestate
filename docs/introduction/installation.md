# Installation

Install the core package, one UI adapter, and the reactivity package you actually use.

## Packages

| Stack           | Packages                                                                                                                                                          |
| --------------- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| React + Signals | `@wirestate/core` `@wirestate/react` `@wirestate/react-signals` `@preact/signals-react` `reflect-metadata`                                                        |
| React + MobX    | `@wirestate/core` `@wirestate/react` `@wirestate/react-mobx` `mobx` `mobx-react-lite` `reflect-metadata`                                                          |
| Lit + Signals   | `@wirestate/core` `@wirestate/lit` `@wirestate/lit-signals` `lit` `@lit/context` `@lit/reactive-element` `@lit-labs/signals` `signal-polyfill` `reflect-metadata` |

### React + Signals

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-signals @preact/signals-react reflect-metadata
```

### React + MobX

```bash
npm install @wirestate/core @wirestate/react @wirestate/react-mobx mobx mobx-react-lite reflect-metadata
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
