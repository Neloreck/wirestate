import { render } from "@testing-library/react";
import { Container, createContainer, EventBus } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { EventEmitter } from "../types/events";

import { useEventEmitter } from "./use-event-emitter";

describe("useEventEmitter", () => {
  it("should return an emitter that dispatches events", () => {
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    bus.subscribe(handler);

    jest.spyOn(bus, "emit");

    let emitter = null as unknown as EventEmitter;

    function TestComponent() {
      emitter = useEventEmitter();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

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
