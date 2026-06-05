# wirestate [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/wirestate.svg?style=flat-square)](https://www.npmjs.com/package/wirestate)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Compatibility package for the unscoped `wirestate` name.

New projects should prefer the scoped packages:
[`@wirestate/core`](https://www.npmjs.com/package/@wirestate/core),
[`@wirestate/react`](https://www.npmjs.com/package/@wirestate/react),
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx), and
[`@wirestate/react-signals`](https://www.npmjs.com/package/@wirestate/react-signals).

## Install

```bash
npm install wirestate react reflect-metadata
```

Install MobX or Preact Signals peers when you use the matching exports.

## Exports

- `wirestate` re-exports `@wirestate/core` and `@wirestate/react`.
- `wirestate/mobx` re-exports `@wirestate/react-mobx`.
- `wirestate/signals` re-exports `@wirestate/react-signals`.

Lit APIs are available from the scoped
[`@wirestate/lit`](https://www.npmjs.com/package/@wirestate/lit) and
[`@wirestate/lit-signals`](https://www.npmjs.com/package/@wirestate/lit-signals) packages.

## Start

```ts
import { Injectable, createContainer } from "wirestate";
import { observer } from "wirestate/mobx";
import { signal } from "wirestate/signals";
```

## Learn More

- [Docs](https://neloreck.github.io/wirestate/)
- [Scoped package overview](https://neloreck.github.io/wirestate/introduction/installation)

## License

MIT
