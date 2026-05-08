import { render } from "@testing-library/react";
import { Container, createIocContainer, EventBus } from "@wirestate/core";

import { withIocProvider } from "../test-utils/with-ioc-provider";
import { EventEmitter } from "../types/events";

import { useEventEmitter } from "./use-event-emitter";

describe("useEventEmitter", () => {
  it("should return an emitter that dispatches events", () => {
    const container: Container = createIocContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    bus.subscribe(handler);

    jest.spyOn(bus, "emit");

    let emitter = null as unknown as EventEmitter;

    function TestComponent() {
      emitter = useEventEmitter();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    (emitter as EventEmitter)("TEST_EVENT", { foo: "bar" }, "source");

    expect(bus.emit).toHaveBeenCalledWith({
      type: "TEST_EVENT",
      payload: { foo: "bar" },
      from: "source",
    });
    expect(handler).toHaveBeenCalledWith({
      type: "TEST_EVENT",
      payload: { foo: "bar" },
      from: "source",
    });
  });
});
