import { Container } from "./container";
import { InjectionToken } from "./tokens";

describe("Provider scopes", () => {
  it("should default to singleton scope for class providers", () => {
    const container = new Container();

    class MyService {}

    container.bind({ provide: MyService, useClass: MyService });

    expect(container.get(MyService)).toBe(container.get(MyService));
  });

  it("should construct transient class providers on every resolution", () => {
    const container = new Container();
    const constructed = jest.fn();

    class MyService {
      public constructor() {
        constructed();
      }
    }

    container.bind({ provide: MyService, useClass: MyService, scope: "transient" });

    const first = container.get(MyService);
    const second = container.get(MyService);

    expect(first).not.toBe(second);
    expect(constructed).toHaveBeenCalledTimes(2);
  });

  it("should construct transient factory providers on every resolution", () => {
    const container = new Container();
    const token = new InjectionToken<{ id: number }>("counter");

    let id = 0;

    container.bind({
      provide: token,
      scope: "transient",
      useFactory: () => ({ id: (id += 1) }),
    });

    expect(container.get(token).id).toBe(1);
    expect(container.get(token).id).toBe(2);
  });

  it("should keep singleton scope when requested explicitly", () => {
    const container = new Container();
    const token = new InjectionToken<object>("singleton");

    container.bind({ provide: token, scope: "singleton", useFactory: () => ({}) });

    expect(container.get(token)).toBe(container.get(token));
  });

  it("should resolve transient parent providers through child containers", () => {
    const parent = new Container();
    const child = parent.createChild();

    // note: intentionally not @injectable() — auto-binding would shadow
    // the parent binding with a child-local singleton provider
    class MyService {}

    parent.bind({ provide: MyService, useClass: MyService, scope: "transient" });

    expect(child.get(MyService)).not.toBe(child.get(MyService));
  });

  it("should not block rebinding for transient providers", () => {
    const container = new Container();
    const token = new InjectionToken<string>("value");

    container.bind({ provide: token, scope: "transient", useFactory: () => "first" });

    expect(container.get(token)).toBe("first");

    // transient providers never own constructed values, so rebinding stays allowed
    container.bind({ provide: token, scope: "transient", useFactory: () => "second" });

    expect(container.get(token)).toBe("second");
  });
});
