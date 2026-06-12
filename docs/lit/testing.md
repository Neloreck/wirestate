# Lit Testing

Test services with `Container`. Use `ContainerProvider` when an element needs a container context.

## Provide a Test Container

Create a small host element that publishes the test container through Lit context, then append tested elements under it.

```ts
import { Container } from "@wirestate/core";
import { ContainerProvider, injection } from "@wirestate/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { CounterService } from "./CounterService";

@customElement("test-host")
class TestHost extends LitElement {
  public container!: Container;

  private provider?: ContainerProvider<this>;

  public connectedCallback() {
    this.provider = new ContainerProvider(this, { container: this.container });
    super.connectedCallback();
  }

  public render() {
    return html`<slot></slot>`;
  }
}

@customElement("counter-view")
class CounterView extends LitElement {
  @injection(CounterService)
  public counter!: CounterService;
}

describe("CounterView", () => {
  let host: TestHost;
  let container: Container;

  beforeEach(() => {
    container = new Container({ bindings: [CounterService], activate: [CounterService] });
    host = new TestHost();
    host.container = container;

    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  test("injects from the test container", () => {
    const element = new CounterView();

    host.appendChild(element);

    expect(element.counter).toBe(container.get(CounterService));
  });
});
```

Append elements under the host so they can consume the provided context.

## API Reference

[`ContainerProvider`](/api/wirestate-lit/classes/ContainerProvider),
[`Container`](/api/wirestate-core/classes/Container).
