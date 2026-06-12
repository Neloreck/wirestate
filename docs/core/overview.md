# Core Overview

`@wirestate/core` contains the framework-agnostic part of Wirestate.

Use it to define services, [construct scoped containers](/api/wirestate-core/classes/Container), run lifecycle hooks,
pass seed data, and communicate through container-local events, commands, and queries.

The core package does not choose a reactivity system. A service can hold plain values, immutable data, external stores,
or reactive objects created by another package.

## Install

```bash
npm install @wirestate/core
```

Wirestate decorators work with legacy TypeScript decorators and TC39 standard decorators. For legacy TypeScript
decorators, enable `experimentalDecorators`. `emitDecoratorMetadata` is not required.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Basic Shape

```ts
import { Container, Injectable } from "@wirestate/core";

@Injectable()
class CounterService {
  public count: number = 0;

  public increment(): void {
    this.count += 1;
  }
}

const container: Container = new Container({
  bindings: [CounterService],
});

const counter = container.get(CounterService);

counter.increment();
```

## What Belongs in Core

- Service classes and dependency injection.
- Root and child containers.
- [Lifecycle hooks](/core/lifecycle) for service activation, service deactivation, provider provision, and provider
  deprovision.
- Events for broadcast notifications.
- Commands for one-handler write operations.
- Queries for one-handler read operations.
- Shared and targeted seed data.
- Test helpers for service and container tests.

## API Reference

[`Container`](/api/wirestate-core/classes/Container), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`WireStatus`](/api/wirestate-core/classes/WireStatus), [`EventBus`](/api/wirestate-core/classes/EventBus),
[`CommandBus`](/api/wirestate-core/classes/CommandBus), [`QueryBus`](/api/wirestate-core/classes/QueryBus).
