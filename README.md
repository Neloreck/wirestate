# wirestate

State management framework based on InversifyJS dependency injection.
Organizes application logic into injectable services that communicate through events, commands, and queries.
Reactivity is handled externally — use MobX, Preact Signals, or your own solution.

## Packages

| NPM                                                                                                                                                   | Package                                                               | Description                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|----------------------------------------------------------|
| [![npm version](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)                   | [`@wirestate/core`](./src/wirestate-core/README.md)                   | DI container, services, events, commands, queries, seeds |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react)                 | [`@wirestate/react`](./src/wirestate-react/README.md)                 | React providers and hooks                                |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react-mobx.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-mobx)       | [`@wirestate/react-mobx`](./src/wirestate-react-mobx/README.md)       | MobX re-exports and decorator wrappers                   |
| [![npm version](https://img.shields.io/npm/v/@wirestate/react-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/react-signals) | [`@wirestate/react-signals`](./src/wirestate-react-signals/README.md) | Preact Signals re-exports                                |
| [![npm version](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)                     | [`@wirestate/lit`](./src/wirestate-lit/README.md)                     | Lit elements integration                                 |
| [![npm version](https://img.shields.io/npm/v/@wirestate/lit-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-signals)     | [`@wirestate/lit-signals`](./src/wirestate-lit-signals/README.md)     | Signals re-exports for Lit                               |

## Installation

### For React

```bash
# Core + React integration
npm install @wirestate/core @wirestate/react reflect-metadata

# With MobX reactivity
npm install @wirestate/react-mobx mobx mobx-react-lite

# With Preact Signals reactivity
npm install @wirestate/react-signals @preact/signals-react
```

Import `reflect-metadata` once at the application entry point before any other wirestate imports.

## License

MIT
