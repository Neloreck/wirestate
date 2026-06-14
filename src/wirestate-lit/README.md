# @wirestate/lit [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Lit bindings for Wirestate containers.

Use this package to provide a Wirestate container through Lit context, inject services into elements, and register
element-scoped event, command, and query handlers.

## Install

```bash
npm install @wirestate/core @wirestate/lit
```

## Start

```ts
import { Injectable } from "@wirestate/core";
import { ContainerProvider, injection, provideContainer } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@Injectable()
class CounterService {
  public count = 0;
}

@customElement("my-app")
class MyApp extends LitElement {
  @provideContainer({ config: { bindings: [CounterService] } })
  private provider!: ContainerProvider;

  protected render() {
    return html`<counter-view></counter-view>`;
  }
}

@customElement("counter-view")
class CounterView extends LitElement {
  @injection(CounterService)
  private counter!: CounterService;

  protected render() {
    return html`<span>${this.counter.count}</span>`;
  }
}
```

## What Is Included

- Container providers: `provideContainer`, `ContainerProvider`, and `useContainerProvider`.
- Injection decorators and controllers.
- Element-scoped event, command, and query decorators/controllers.
- `useContainer`, `useInjection`, and `useOptionalInjection` helpers.

This package connects services to Lit. For reactive rendering, use
[`@wirestate/lit-signals`](https://www.npmjs.com/package/@wirestate/lit-signals) or
[`@wirestate/lit-mobx`](https://www.npmjs.com/package/@wirestate/lit-mobx).

## Learn More

- [Lit guide](https://neloreck.github.io/wirestate/lit/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-lit/)

## License

MIT
