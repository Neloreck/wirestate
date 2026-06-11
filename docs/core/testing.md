# Core Testing

Services are TypeScript classes, but most services are designed to be resolved by a container. Test simple services
directly when their constructor and methods do not need Wirestate. Use a fresh container when dependency injection,
lifecycle, seeds, or message buses are part of the behavior.

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

Use `container.bind` with a fresh `createContainer` when one service needs Wirestate wiring.

```ts
import { createContainer } from "@wirestate/core";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = createContainer().bind(CounterService).get(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```

Skip activation hooks when that setup is unrelated to the test.

```ts
import { createContainer } from "@wirestate/core";

const service = createContainer({ bindings: [CounterService] }, { skipActivationHooks: true }).get(CounterService);
```

## Several Services

`createContainer` binds a group of services. Use `activate` when activation behavior needs to run before assertions. Use
`provisionContainer` when the behavior under test lives in `@OnProvision` or `@OnDeprovision`.

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

Use `container.bind` when a test starts from an existing container and needs one more service or descriptor.

```ts
import { createContainer } from "@wirestate/core";
import { CartService, PricingService } from "./services";

test("cart uses pricing service", () => {
  const container = createContainer({ bindings: [CartService] });

  container.bind(PricingService);

  const cart = container.get(CartService);

  expect(cart.total()).toBe(25);
});
```

Use `container.unbind` to remove a binding, deactivating any constructed service.

```ts
import { createContainer } from "@wirestate/core";

const container = createContainer({ bindings: [CartService] });

container.bind(PricingService);
container.unbind(PricingService);
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { createContainer } from "@wirestate/core";

test("cart uses mocked api client", async () => {
  const container = createContainer({ bindings: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  container.bind({ token: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## API Reference

[`createContainer`](/api/wirestate-core/functions/createContainer),
[`Container`](/api/wirestate-core/classes/Container).
