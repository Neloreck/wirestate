# wirestate [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/wirestate.svg?style=flat-square)](https://www.npmjs.com/package/wirestate)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Compatibility package for the unscoped `wirestate` name.

New projects should prefer the scoped packages for the stack they use:
[`@wirestate/core`](https://www.npmjs.com/package/@wirestate/core),
[`@wirestate/react`](https://www.npmjs.com/package/@wirestate/react),
[`@wirestate/lit`](https://www.npmjs.com/package/@wirestate/lit),
[`@wirestate/mobx`](https://www.npmjs.com/package/@wirestate/mobx),
[`@wirestate/signals`](https://www.npmjs.com/package/@wirestate/signals),
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx),
[`@wirestate/lit-mobx`](https://www.npmjs.com/package/@wirestate/lit-mobx),
[`@wirestate/react-signals`](https://www.npmjs.com/package/@wirestate/react-signals),
[`@wirestate/lit-signals`](https://www.npmjs.com/package/@wirestate/lit-signals).

## Install

```bash
npm install wirestate
```

## Exports

- `wirestate` re-exports `@wirestate/core` and `@wirestate/react`.
- `wirestate/mobx` re-exports `@wirestate/mobx` and `@wirestate/react-mobx`.
- `wirestate/signals` re-exports `@wirestate/signals` and `@wirestate/react-signals`.

The React MobX rendering binding (`observer`) lives in
[`@wirestate/react-mobx`](https://www.npmjs.com/package/@wirestate/react-mobx). Lit APIs are available from the scoped
[`@wirestate/lit`](https://www.npmjs.com/package/@wirestate/lit),
[`@wirestate/lit-mobx`](https://www.npmjs.com/package/@wirestate/lit-mobx), and
[`@wirestate/lit-signals`](https://www.npmjs.com/package/@wirestate/lit-signals) packages.

## Start

```ts
import { Injectable, Container } from "wirestate";
import { Action, Observable, makeObservable, observer } from "wirestate/mobx";
import { signal, useSignals } from "wirestate/signals";
```

## Learn More

- [Docs](https://neloreck.github.io/wirestate/)
- [Scoped package overview](https://neloreck.github.io/wirestate/introduction/installation)

## License

MIT
