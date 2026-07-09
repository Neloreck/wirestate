# Installation

Install the Wirestate packages for the stack you use.

The commands below list Wirestate packages only. Modern package managers resolve React, Lit, MobX, and Signals peers. If
your package manager reports a missing peer, install that package directly.

## Packages

| Stack           | Packages                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| Core only       | `@wirestate/core`                                                                    |
| React           | `@wirestate/core` `@wirestate/react`                                                 |
| Lit             | `@wirestate/core` `@wirestate/lit`                                                   |
| React + Signals | `@wirestate/core` `@wirestate/react` `@wirestate/signals` `@wirestate/react-signals` |
| React + MobX    | `@wirestate/core` `@wirestate/react` `@wirestate/mobx` `@wirestate/react-mobx`       |
| Lit + Signals   | `@wirestate/core` `@wirestate/lit` `@wirestate/signals` `@wirestate/lit-signals`     |
| Lit + MobX      | `@wirestate/core` `@wirestate/lit` `@wirestate/mobx` `@wirestate/lit-mobx`           |

Signal services use the framework-agnostic `@wirestate/signals` package. MobX services use `@wirestate/mobx`. The same
service definitions can be shared across React and Lit.

For external API details, use the official docs for [React](https://react.dev/reference/react),
[Lit](https://lit.dev/docs/), [Preact Signals](https://preactjs.com/guide/v10/signals), and
[MobX](https://mobx.js.org/README.html).

### React + Signals

```bash
npm install @wirestate/core @wirestate/signals @wirestate/react @wirestate/react-signals
```

See the [React Signals overview](/react-signals/overview) for services, components, and transform setup.

### React + MobX

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/react @wirestate/react-mobx
```

See the [React MobX overview](/react-mobx/overview) for services, components, and computed state.

### Lit + Signals

```bash
npm install @wirestate/core @wirestate/signals @wirestate/lit @wirestate/lit-signals
```

See the [Lit Signals overview](/lit-signals/overview) for services, templates, and computed signals.

### Lit + MobX

```bash
npm install @wirestate/core @wirestate/mobx @wirestate/lit @wirestate/lit-mobx
```

See the [Lit MobX overview](/lit-mobx/overview) for services, elements, and computed state.


## Next Steps

- Start with [Core overview](/core/overview) for services and containers.
- Use [React overview](/react/overview) for React applications.
- Use [Lit overview](/lit/overview) for Lit applications.
- Use [React Signals](/react-signals/overview), [React MobX](/react-mobx/overview),
  [Lit Signals](/lit-signals/overview), or [Lit MobX](/lit-mobx/overview) for framework reactivity packages.
