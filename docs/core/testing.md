# Core Testing

Services are TypeScript classes, but most services are designed to be resolved by a container. Test simple services
directly when their constructor and methods do not need Wirestate. Use a fresh container when dependency injection,
lifecycle, seeds, or buses are part of the behavior.

## No Container

```ts
import { LoggerService } from "./LoggerService";

test("logs a message", () => {
  const logger = new LoggerService();
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});

  logger.log("hello");

  expect(spy).toHaveBeenCalledWith("[log] hello");

  spy.mockRestore();
});
```

## One Service

Use `bind` with a fresh `createContainer` when one service needs Wirestate wiring.

```ts
import { bind, createContainer } from "@wirestate/core";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = bind(createContainer(), CounterService).get(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```

Skip lifecycle when hook setup is noise for the test.

```ts
import { createContainer } from "@wirestate/core";

const service = createContainer({ bindings: [CounterService] }, { skipLifecycle: true }).get(CounterService);
```

## Several Services

`createContainer` binds a group of services. Use `activate` when resolution-time behavior needs to run before assertions.
Use `provisionContainer` when the behavior under test lives in `@OnProvision` or `@OnDeprovision`.

```ts
import { EventBus, createContainer } from "@wirestate/core";
import { CounterService, LoggerService } from "./services";

test("counter emits event on increment", () => {
  const container = createContainer({
    activate: [CounterService],
    bindings: [LoggerService, CounterService],
  });

  const counter = container.get(CounterService);
  const events: Array<string | symbol> = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");
});
```

## Add Bindings

Use `bind` when a test starts from an existing container and needs one more service or descriptor.

```ts
import { bind, createContainer } from "@wirestate/core";
import { CartService, PricingService } from "./services";

test("cart uses pricing service", () => {
  const container = createContainer({ bindings: [CartService] });

  bind(container, PricingService);

  const cart = container.get(CartService);

  expect(cart.total()).toBe(25);
});
```

Use `unbind` to remove a binding through Wirestate's cleanup path.

```ts
import { bind, createContainer, unbind } from "@wirestate/core";

const container = createContainer({ bindings: [CartService] });

bind(container, PricingService);
unbind(container, PricingService);
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { bind, createContainer } from "@wirestate/core";

test("cart uses mocked api client", async () => {
  const container = createContainer({ bindings: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  bind(container, { token: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## API Reference

[`createContainer`](/api/wirestate-core/functions/createContainer), [`bind`](/api/wirestate-core/functions/bind),
[`unbind`](/api/wirestate-core/functions/unbind).
