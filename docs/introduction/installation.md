# Installation

Wirestate consists of a core package and UI-specific bindings.

## 1. Choose your core and bindings

| UI    | Reactivity | Packages to Install                           |
|-------|------------|-----------------------------------------------|
| React | Signals    | `@wirestate/react` `@wirestate/react-signals` |
| React | MobX       | `@wirestate/react` `@wirestate/react-mobx`    |
| Lit   | Signals    | `@wirestate/lit` `@wirestate/lit-signals`     |

## 2. Install

To use wirestate you will need `@wirestate/core` and specific binding packages depending on rendering and 
state management libraries you use.

### 2.A `React` with `signals`

```bash
npm install --save @wirestate/core @wirestate/react
npm install --save @wirestate/react-signals @preact/signals-react
```

### 2.B `React` with `MobX`

```bash
npm install --save @wirestate/core @wirestate/react
npm install --save @wirestate/react-mobx mobx mobx-react-lite
```

### 2.C `Lit` with `signals`

```bash
npm install --save @wirestate/core @wirestate/lit
npm install --save @wirestate/lit-signals @preact/signals-core
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
