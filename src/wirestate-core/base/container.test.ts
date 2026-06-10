import { Container } from "./container";
import { inject } from "./context";
import { InjectionToken } from "./tokens";

const myServiceConstructorSpy = jest.fn();

class MyService {
  public constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Container API", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("inject", () => {
    expect(() => inject(MyService)).toThrow("You can only invoke inject() within an injection context");

    const container = new Container();
    const token = new InjectionToken<MyService>("some-token");

    expect(() => container.get(token)).toThrow("No binding(s) found");

    container.bind(MyService);
    container.bind({
      token: token,
      factory: () => inject(MyService),
    });

    expect(container.get(token)).toBeInstanceOf(MyService);
  });

  it("has", () => {
    const container = new Container();
    const childContainer = container.createChild();
    const token = new InjectionToken<MyService>("some-token");

    expect(container.has(token)).toBe(false);
    expect(childContainer.has(token)).toBe(false);

    container.bind({ token: token, type: "Instance", value: MyService });
    expect(container.has(token)).toBe(true);
    expect(childContainer.has(token)).toBe(true);

    // has shall not construct the provider
    const factoryToken = new InjectionToken<MyService>("some-factory-token");
    const spy = jest.fn();

    container.bind({
      token: factoryToken,
      factory: () => {
        spy();

        return new MyService();
      },
    });
    expect(container.has(factoryToken)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(0);
    container.get(factoryToken);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe("contexts", () => {
    it("should support nesting without interference", () => {
      const container1 = new Container().bind({ token: "a", factory: () => "A" });
      const container2 = new Container().bind({ token: "b", factory: () => container1.get("a") });

      const container3 = new Container()
        .bind({ token: "c", factory: () => container2.get("b") })
        .bind({ token: "d", factory: () => inject("c") })
        .bind({ token: "e", factory: () => inject("b") });

      expect(container3.get("c")).toBe("A");
      expect(container3.get("d")).toBe("A");

      expect(() => container3.get("e")).toThrow("No binding(s) found for b");
      expect(() => container3.get("b")).toThrow("No binding(s) found for b");
    });
  });

  it("should unbind a single service", () => {
    const container = new Container();

    container.bind({ token: MyService, type: "Instance", value: MyService });

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(0);

    const myService1 = container.get(MyService);
    const myService2 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
    expect(myService1).toBe(myService2);

    container.unbind(MyService);

    expect(() => container.get(MyService)).toThrow("No binding(s) found");

    container.bind({ token: MyService, type: "Instance", value: MyService });

    const myService3 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(2);
    expect(myService3).not.toBe(myService1);
    expect(myService3).not.toBe(myService2);
  });

  it("should unbind all services", () => {
    const container = new Container();
    const token = new InjectionToken<string>("value");

    container.bind({ token: token, value: "first" });

    expect(container.get(token)).toBe("first");

    container.unbindAll();

    expect(() => container.get(token)).toThrow("No binding(s) found");

    container.bind({ token: token, value: "second" });

    expect(container.get(token)).toBe("second");
  });

  it("should resolve the container itself", () => {
    const container = new Container();

    expect(container.get(Container)).toBe(container);
  });
});
