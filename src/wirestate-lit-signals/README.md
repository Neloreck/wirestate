# @wirestate/lit-signals [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/lit-signals.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/lit-signals)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/master/LICENSE)

Re-exports `@lit-labs/signals` for use with wirestate services in Lit elements.

## Installation

```bash
npm install @wirestate/lit-signals @lit-labs/signals
```

## Usage

```ts
import {
  signal,
  computed,
  watch,
  Signal,
  State,
  Computed,
} from '@wirestate/lit-signals';
```

Example service:

```ts
import { Injectable, Inject, WireScope } from '@wirestate/core';
import { signal, computed, State, Computed } from '@wirestate/lit-signals';

@Injectable()
export class CounterService {
  public readonly count: State<number> = signal(0);
  public readonly isEven: Computed<boolean> = computed(() => this.count.get() % 2 === 0);

  public constructor(@Inject(WireScope) private scope: WireScope) {}

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }
}
```

Example Lit element:

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { injection } from '@wirestate/lit';
import { watch, computed } from '@wirestate/lit-signals';

import { CounterService } from './services';

@customElement('my-component')
class MyComponent extends LitElement {
  @injection({ injectionId: CounterService })
  private readonly counterService!: CounterService;

  private isOddLabel = computed(() => (this.counterService.count.get() % 2 === 0 ? "even" : "odd"));

  render() {
    return html`
      <button @click="${() => this.counterService.increment()}">
        count: ${watch(this.counterService.count)} (${watch(this.isOddLabel)})
      </button>
    `;
  }
}
```

## License

MIT
