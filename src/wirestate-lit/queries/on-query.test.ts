import { ReactiveElement } from "@lit/reactive-element";
import { QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { onQuery } from "./on-query";

describe("onQuery", () => {
  @customElement("ws-query-decorated")
  class DecoratedQueryElement extends ReactiveElement {
    @onQuery("TEST_QUERY")
    public onTestQuery(data: string): string {
      return data + "-result";
    }
  }

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should register decorated method as query handler on connect", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element = new DecoratedQueryElement();

    expect(bus.has("TEST_QUERY")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_QUERY")).toBe(true);

    element.remove();
    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should call decorated method when query is dispatched", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: DecoratedQueryElement = new DecoratedQueryElement();

    provider.appendChild(element);

    const result: string = await bus.query<string, string>("TEST_QUERY", "input");

    expect(result).toBe("input-result");

    element.remove();
    expect(() => bus.query<string, string>("TEST_QUERY")).toThrow(
      "No query handler registered in container for type: 'TEST_QUERY'."
    );
  });
});
