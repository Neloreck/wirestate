import { render } from "@testing-library/react";
import { Container, EventBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { EventEmitter } from "../types/events";

import { useEventEmitter } from "./use-event-emitter";

describe("useEventEmitter", () => {
  it("should return an emitter that dispatches events", () => {
    const container: Container = new Container();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    bus.subscribe(handler);

    jest.spyOn(bus, "emit");

    let emitter = null as unknown as EventEmitter;

    function TestComponent() {
      emitter = useEventEmitter();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    (emitter as EventEmitter)("TEST_EVENT", { foo: "bar" }, { source: "source" });

    expect(bus.emit).toHaveBeenCalledWith("TEST_EVENT", { foo: "bar" }, { source: "source" });
    expect(handler).toHaveBeenCalledWith({
      type: "TEST_EVENT",
      payload: { foo: "bar" },
      source: "source",
    });
  });
});
