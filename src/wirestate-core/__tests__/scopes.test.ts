import { InjectionToken } from "../binding/tokens";
import { ContainerKernel } from "../container/container-kernel";
import { Injectable } from "../metadata/injectable";

describe("Binding scopes", () => {
  it("should default to singleton scope for instance bindings", () => {
    const container = new ContainerKernel();

    @Injectable()
    class MyService {}

    container.bind({ token: MyService, type: "Instance", value: MyService });

    expect(container.get(MyService)).toBe(container.get(MyService));
  });

  it("should construct transient instance bindings on every resolution", () => {
    const container = new ContainerKernel();
    const constructed = jest.fn();

    @Injectable()
    class MyService {
      public constructor() {
        constructed();
      }
    }

    container.bind({ token: MyService, scope: "Transient", factory: () => new MyService() });

    const first = container.get(MyService);
    const second = container.get(MyService);

    expect(first).not.toBe(second);
    expect(constructed).toHaveBeenCalledTimes(2);
  });

  it("should construct transient dynamic value bindings on every resolution", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<{ id: number }>("counter");

    let id = 0;

    container.bind({
      token: token,
      scope: "Transient",
      factory: () => ({ id: (id += 1) }),
    });

    expect(container.get(token).id).toBe(1);
    expect(container.get(token).id).toBe(2);
  });

  it("should keep singleton scope when requested explicitly", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<object>("singleton");

    container.bind({ token: token, scope: "Singleton", factory: () => ({}) });

    expect(container.get(token)).toBe(container.get(token));
  });

  it("should resolve transient parent bindings through child containers", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);

    @Injectable()
    class MyService {}

    parent.bind({ token: MyService, scope: "Transient", factory: () => new MyService() });

    expect(child.get(MyService)).not.toBe(child.get(MyService));
  });

  it("should not block rebinding for transient bindings", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<string>("value");

    container.bind({ token: token, scope: "Transient", factory: () => "first" });

    expect(container.get(token)).toBe("first");

    // transient providers never own constructed values, so rebinding stays allowed
    container.bind({ token: token, scope: "Transient", factory: () => "second" });

    expect(container.get(token)).toBe("second");
  });
});
