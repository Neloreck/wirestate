# Installation

Wirestate consists of a core package and UI-specific bindings.

## 1. Choose your core and bindings

| UI    | Reactivity | Packages to Install                                                                                                                                         |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React | Signals    | `@wirestate/core` `@wirestate/react` `@wirestate/react-signals` `reflect-metadata`                                                                          |
| React | MobX       | `@wirestate/core` `@wirestate/react` `@wirestate/react-mobx` `reflect-metadata`                                                                             |
| Lit   | Signals    | `@wirestate/core` `@wirestate/lit` `@wirestate/lit-signals` `@lit/context` `@lit/reactive-element` `@lit-labs/signals` `signal-polyfill` `reflect-metadata` |

## 2. Install

Wirestate needs `@wirestate/core` plus binding packages for your renderer and state library.

Select <ins>one of</ins> the variants matching your setup below:

### 2.A `React` with `signals`

```bash
npm install --save @wirestate/core @wirestate/react reflect-metadata
npm install --save @wirestate/react-signals @preact/signals-react
```

### 2.B `React` with `MobX`

```bash
npm install --save @wirestate/core @wirestate/react reflect-metadata
npm install --save @wirestate/react-mobx mobx mobx-react-lite
```

### 2.C `Lit` with `signals`

```bash
npm install --save @wirestate/core @wirestate/lit reflect-metadata
npm install --save @wirestate/lit-signals @lit-labs/signals signal-polyfill
```

## 3. Requirements

You need to import `reflect-metadata` at the entry point of your application:

```ts
import "reflect-metadata";
```

## 4. Setup

Wirestate requires TypeScript with `experimentalDecorators` and `emitDecoratorMetadata` enabled in your `tsconfig.json`.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
