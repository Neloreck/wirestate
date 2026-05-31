# Lit Testing

Test services with `createContainer`. Use `@wirestate/lit/test-utils` when an element needs a container context.

## Create a Lit Provision

`createLitProvision` creates a test host and publishes a container through Lit context.

```ts
import { createContainer } from "@wirestate/core";
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
    const container = createContainer({ bindings: [CounterService], activate: [CounterService] });

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

Append elements under `fixture.provider` so they can consume the provided context.

## API Reference

[`createLitProvision`](/api/wirestate-lit/test-utils/functions/createLitProvision),
[`LitProvisionFixture`](/api/wirestate-lit/test-utils/interfaces/LitProvisionFixture),
[`createContainer`](/api/wirestate-core/functions/createContainer).
