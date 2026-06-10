# Core Overview

`@wirestate/core` contains the framework-agnostic part of Wirestate.

Use it to define services, [create scoped containers](/api/wirestate-core/functions/createContainer), run lifecycle
hooks, pass seed data, and communicate through container-local events, commands, and queries.

The core package does not choose a reactivity system. A service can hold plain values, immutable data, external stores,
or reactive objects created by another package.

## Install

```bash
npm install @wirestate/core
```

Enable decorators in TypeScript when using `@Injectable`, `@OnEvent`, and other Wirestate decorators.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Basic Shape

```ts
import { Container, Injectable, createContainer } from "@wirestate/core";

@Injectable()
class CounterService {
  public count: number = 0;

  public increment(): void {
    this.count += 1;
  }
}

const container: Container = createContainer({
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

[`createContainer`](/api/wirestate-core/functions/createContainer), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`WireStatus`](/api/wirestate-core/classes/WireStatus), [`EventBus`](/api/wirestate-core/classes/EventBus),
[`CommandBus`](/api/wirestate-core/classes/CommandBus), [`QueryBus`](/api/wirestate-core/classes/QueryBus).
