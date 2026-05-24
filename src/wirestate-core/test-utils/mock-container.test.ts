import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType, Container, Injectable } from "../alias";

import { mockContainer } from "./mock-container";

describe("mockContainer", () => {
  it("should validate activation entries before binding test services", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      mockContainer({
        activate: ["MissingService"],
        entries: [TestService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");
  });

  it("should validate activate true against descriptor entries", () => {
    const TOKEN: unique symbol = Symbol("test-service");

    @Injectable()
    class TestService {}

    expect(() =>
      mockContainer({
        activate: true,
        entries: [
          {
            bindingType: BindingType.Instance,
            id: TOKEN,
            value: TestService,
          },
        ],
      })
    ).not.toThrow();
  });

  it("should activate requested mock entries after validation", () => {
    let activated: boolean = false;

    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    const container: Container = mockContainer({
      activate: [TestService],
      entries: [TestService],
    });

    expect(container.get(TestService)).toBeInstanceOf(TestService);
    expect(activated).toBe(true);
  });

  it("should handle activation lifecycle when skipLifecycle is false", () => {
    const { LifecycleService, events } = createLifecycleService();

    const container: Container = mockContainer({
      activate: [LifecycleService],
      entries: [LifecycleService],
    });

    expect(container.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(events).toEqual(["activated"]);

    container.unbindAll();

    expect(events).toEqual(["activated", "deactivation"]);
  });

  it("should skip activation lifecycle when skipLifecycle is true", () => {
    const { LifecycleService, events } = createLifecycleService();

    const container: Container = mockContainer({
      activate: [LifecycleService],
      entries: [LifecycleService],
      skipLifecycle: true,
    });

    expect(container.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(events).toEqual([]);

    container.unbindAll();

    expect(events).toEqual([]);
  });
});
