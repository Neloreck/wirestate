# @wirestate/core [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/core.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Framework-agnostic Wirestate runtime.

Use this package to define injectable services, create scoped Inversify containers, pass seed data, run lifecycle hooks,
and communicate through container-local events, commands, and queries.

## Install

```bash
npm install @wirestate/core reflect-metadata
```

Import `reflect-metadata` once before Wirestate decorators are used:

```ts
import "reflect-metadata";
```

## Start

```ts
import { Injectable, createContainer } from "@wirestate/core";

@Injectable()
class CounterService {
  public count: number = 0;

  public increment(): void {
    this.count++;
  }
}

const container = createContainer({
  bindings: [CounterService],
});

const counterService = container.get(CounterService);

counterService.increment();
```

## What Is Included

- Inversify aliases such as `Injectable`, `Inject`, `Container`, and `Identifier`.
- `createContainer`, `bind`, `unbind`, and `unbindAll`.
- `WireScope` for scoped resolution, seeds, events, commands, and queries.
- `WireStatus` and `ProvisionId` for lifecycle guards on resolved service instances.
- `EventBus`, `CommandBus`, `QueryBus`, and their decorators.
- `OnActivated`, `OnDeactivation`, `OnProvision`, and `OnDeprovision`.

React and Lit integration live in [`@wirestate/react`](https://www.npmjs.com/package/@wirestate/react) and
[`@wirestate/lit`](https://www.npmjs.com/package/@wirestate/lit).

## Learn More

- [Core guide](https://neloreck.github.io/wirestate/core/overview)
- [API reference](https://neloreck.github.io/wirestate/api/wirestate-core/)

## License

MIT
