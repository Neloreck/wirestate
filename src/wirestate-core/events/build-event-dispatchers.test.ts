import { EventDispatch, EventType } from "../types/events";
import { Optional } from "../types/general";

import { buildEventDispatchers } from "./build-event-dispatchers";
import { EventBus } from "./event-bus";
import { OnEvent } from "./on-event";

describe("buildEventDispatcher", () => {
  it("should return an empty list when the instance declares no handlers", () => {
    class PlainService {
      public example(): void {
        return void 0;
      }
    }

    expect(buildEventDispatchers(new PlainService())).toEqual([]);
  });

  it("should produce one descriptor per decorated method with its declared types", () => {
    class TestService {
      @OnEvent("FIRST")
      public onFirst(): void {
        return void 0;
      }

      @OnEvent(["SECOND", "THIRD"])
      public onSecondThird(): void {
        return void 0;
      }

      @OnEvent()
      public onEverything(): void {
        return void 0;
      }
    }

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());

    expect(dispatches).toHaveLength(3);
    expect(dispatches.map((dispatch) => dispatch.types)).toEqual([["FIRST"], ["SECOND", "THIRD"], null]);
  });

  it("should deduplicate repeated types on a single method", () => {
    class TestService {
      @OnEvent(["A", "A", "B"])
      public onEvent(): void {
        return void 0;
      }
    }

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());

    expect(dispatches).toHaveLength(1);
    expect(dispatches[0].types).toEqual(["A", "B"]);
  });

  it("should bind each descriptor handler to its own method", () => {
    const calls: Array<string> = [];

    class TestService {
      @OnEvent("FIRST")
      public onFirst(): void {
        calls.push("first");
      }

      @OnEvent()
      public onEverything(): void {
        calls.push("everything");
      }
    }

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());

    // The bus decides when to call a descriptor; the handler itself does not
    // filter by type, so invoking it always runs its bound method.
    for (const dispatch of dispatches) {
      dispatch.handler({ type: "ANYTHING" });
    }

    expect(calls).toEqual(["first", "everything"]);
  });

  it("should keep parent-to-child method order in the descriptor list", () => {
    class BaseService {
      @OnEvent("SHARED")
      public onBase(): void {
        return void 0;
      }
    }

    class DerivedService extends BaseService {
      @OnEvent("SHARED")
      public onDerived(): void {
        return void 0;
      }
    }

    const calls: Array<string> = [];
    const service = new DerivedService();

    jest.spyOn(service, "onBase").mockImplementation(() => calls.push("base"));
    jest.spyOn(service, "onDerived").mockImplementation(() => calls.push("derived"));

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(service);

    expect(dispatches).toHaveLength(2);

    for (const dispatch of dispatches) {
      dispatch.handler({ type: "SHARED" });
    }

    expect(calls).toEqual(["base", "derived"]);
  });

  it("should isolate and report a thrown handler with instance context", () => {
    const error = new Error("handler failed");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    class TestService {
      @OnEvent("TEST")
      public onEvent(): void {
        throw error;
      }
    }

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());
    const dispatch: Optional<EventDispatch> = dispatches[0] ?? null;

    expect(() => dispatch?.handler({ type: "TEST" })).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith("[wirestate] Event handler threw:", error);

    errorSpy.mockRestore();
  });

  it("should subscribe a catch-all method with null types", () => {
    class TestService {
      @OnEvent()
      public onEverything(): void {
        return void 0;
      }
    }

    const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());
    const types: Optional<ReadonlyArray<EventType>> = dispatches[0].types;

    expect(types).toBeNull();
  });

  describe("a method decorated multiple times", () => {
    function subscribeAll(instance: object): EventBus {
      const bus: EventBus = new EventBus();

      for (const dispatch of buildEventDispatchers(instance)) {
        bus.subscribe(dispatch.types, dispatch.handler);
      }

      return bus;
    }

    it("should merge stacked decorations of one method into a single descriptor", () => {
      class TestService {
        @OnEvent("A")
        @OnEvent("B")
        public onEvent(): void {
          return void 0;
        }
      }

      const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());

      expect(dispatches).toHaveLength(1);
      expect([...(dispatches[0].types ?? [])].sort()).toEqual(["A", "B"]);
    });

    it("should invoke a method decorated with the same type twice only once per event", () => {
      const onEvent = jest.fn();

      class TestService {
        @OnEvent("A")
        @OnEvent("A")
        public onEvent(): void {
          onEvent();
        }
      }

      subscribeAll(new TestService()).emit("A");

      expect(onEvent).toHaveBeenCalledTimes(1);
    });

    it("should invoke a method once per event for overlapping type lists", () => {
      const onEvent = jest.fn();

      class TestService {
        @OnEvent(["A", "B"])
        @OnEvent(["B", "C"])
        public onEvent(): void {
          onEvent();
        }
      }

      const bus: EventBus = subscribeAll(new TestService());

      bus.emit("B");
      expect(onEvent).toHaveBeenCalledTimes(1);

      bus.emit("A");
      bus.emit("C");
      expect(onEvent).toHaveBeenCalledTimes(3);
    });

    it("should collapse to catch-all when a method mixes catch-all and typed decorations", () => {
      const onEvent = jest.fn();

      class TestService {
        @OnEvent()
        @OnEvent("A")
        public onEvent(): void {
          onEvent();
        }
      }

      const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new TestService());

      expect(dispatches).toHaveLength(1);
      expect(dispatches[0].types).toBeNull();

      const bus: EventBus = new EventBus();

      for (const dispatch of dispatches) {
        bus.subscribe(dispatch.types, dispatch.handler);
      }

      bus.emit("A");
      bus.emit("B");

      // Once for "A" (not twice) and once for "B", as a single catch-all handler.
      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it("should merge a redeclared handler across the inheritance chain", () => {
      const onEvent = jest.fn();

      class BaseService {
        @OnEvent("SHARED")
        public onEvent(): void {
          onEvent();
        }
      }

      class DerivedService extends BaseService {
        @OnEvent("SHARED")
        public onEvent(): void {
          onEvent();
        }
      }

      const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(new DerivedService());

      expect(dispatches).toHaveLength(1);

      subscribeAll(new DerivedService()).emit("SHARED");

      expect(onEvent).toHaveBeenCalledTimes(1);
    });
  });
});
