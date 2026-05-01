import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { EventBus } from "@/wirestate/core/events/event-bus";
import { useEventEmitter } from "@/wirestate/core/events/use-event-emitter";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { TEventEmitter } from "@/wirestate/types/events";
import { Optional } from "@/wirestate/types/general";

describe("useEventEmitter", () => {
  it("should return an emitter that dispatches events", () => {
    const container: Container = createIocContainer();
    const bus: EventBus = container.get<EventBus>(EVENT_BUS_TOKEN);
    const handler = jest.fn();

    bus.subscribe(handler);

    jest.spyOn(bus, "emit");

    let emitter: Optional<TEventEmitter> = null as Optional<TEventEmitter>;

    function TestComponent() {
      emitter = useEventEmitter();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    (emitter as TEventEmitter)("TEST_EVENT", { foo: "bar" }, "source");

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
