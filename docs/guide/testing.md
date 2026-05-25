# Testing

Services are TypeScript classes. Test plain logic directly. Use a container only when DI, lifecycle, seeds, or buses matter.

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

`mockService` creates a mock container, binds the service, and returns the instance.

```ts
import { mockService } from "@wirestate/core/test-utils";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = mockService(CounterService);

  service.increment();

  expect(service.count.value).toBe(1);
});
```

Skip lifecycle when the hook setup is noise for this test.

```ts
import { mockContainer, mockService } from "@wirestate/core/test-utils";

const service = mockService(CounterService, mockContainer(), { skipLifecycle: true });
```

## Several Services

`mockContainer` binds a group of services. Use `activate` when `@OnActivated` needs to run before assertions.

```ts
import { EventBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { CounterService, LoggerService } from "./services";

test("counter emits event on increment", () => {
  const container = mockContainer({
    entries: [LoggerService, CounterService],
    activate: [CounterService],
  });

  const counter = container.get(CounterService);
  const events: Array<string | symbol> = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");
});
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { bindConstant } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

test("cart uses mocked api client", async () => {
  const container = mockContainer({ entries: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  bindConstant(container, { id: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## Rebind During A Test

Use mock bind helpers when a test needs to swap implementations.

```ts
import { mockBindEntry, mockBindService, mockContainer, mockUnbindService } from "@wirestate/core/test-utils";

const container = mockContainer({ entries: [LoggerService] });
const fakeCounter = { increment: jest.fn() } as unknown as CounterService;

mockBindService(container, CounterService);
mockUnbindService(container, CounterService);
mockBindEntry(container, { id: CounterService, value: fakeCounter });
```

## React

`withContainerProvider` wraps a React tree with a test container.

```tsx
import { render } from "@testing-library/react";
import { mockContainer } from "@wirestate/core/test-utils";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { Counter } from "./Counter";
import { CounterService } from "./CounterService";

test("renders count", () => {
  const container = mockContainer({ entries: [CounterService], activate: [CounterService] });

  const { getByText } = render(withContainerProvider(<Counter />, container));

  expect(getByText("Count: 0")).toBeInTheDocument();
});
```

## Lit

`createLitProvision` creates a test host and publishes a container through Lit context.

```ts
import { mockContainer } from "@wirestate/core/test-utils";
import { injection } from "@wirestate/lit";
import { createLitProvision, LitProvisionFixture } from "@wirestate/lit/test-utils";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { CounterService } from "./CounterService";

@customElement("counter-view")
class CounterView extends LitElement {
  @injection(CounterService)
  public counter!: CounterService;
}

describe("CounterView", () => {
  let fixture: LitProvisionFixture;

  beforeEach(() => {
    const container = mockContainer({ entries: [CounterService], activate: [CounterService] });

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  test("injects from the test container", () => {
    const element = new CounterView();

    fixture.provider.appendChild(element);

    expect(element.counter).toBe(fixture.container.get(CounterService));
  });
});
```
