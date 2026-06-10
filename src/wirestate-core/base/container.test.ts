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

    expect(() => container.get(token)).toThrow("No provider(s) found");

    container.bind(MyService);
    container.bind({
      provide: token,
      useFactory: () => inject(MyService),
    });

    expect(container.get(token)).toBeInstanceOf(MyService);
  });

  it("has", () => {
    const container = new Container();
    const childContainer = container.createChild();
    const token = new InjectionToken<MyService>("some-token");

    expect(container.has(token)).toBe(false);
    expect(childContainer.has(token)).toBe(false);

    container.bind({ provide: token, useClass: MyService });
    expect(container.has(token)).toBe(true);
    expect(childContainer.has(token)).toBe(true);

    // has shall not construct the provider
    const factoryToken = new InjectionToken<MyService>("some-factory-token");
    const spy = jest.fn();

    container.bind({
      provide: factoryToken,
      useFactory: () => {
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
      const container1 = new Container().bind({ provide: "a", useFactory: () => "A" });
      const container2 = new Container().bind({ provide: "b", useFactory: () => container1.get("a") });

      const container3 = new Container()
        .bind({ provide: "c", useFactory: () => container2.get("b") })
        .bind({ provide: "d", useFactory: () => inject("c") })
        .bind({ provide: "e", useFactory: () => inject("b") });

      expect(container3.get("c")).toBe("A");
      expect(container3.get("d")).toBe("A");

      expect(() => container3.get("e")).toThrow("No provider(s) found for b");
      expect(() => container3.get("b")).toThrow("No provider(s) found for b");
    });
  });

  it("should unbind a single service", () => {
    const container = new Container();

    container.bind({ provide: MyService, useClass: MyService });

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(0);

    const myService1 = container.get(MyService);
    const myService2 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
    expect(myService1).toBe(myService2);

    container.unbind(MyService);

    expect(() => container.get(MyService)).toThrow("No provider(s) found");

    container.bind({ provide: MyService, useClass: MyService });

    const myService3 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(2);
    expect(myService3).not.toBe(myService1);
    expect(myService3).not.toBe(myService2);
  });

  it("should unbind all services", () => {
    const container = new Container();
    const token = new InjectionToken<string>("value");

    container.bind({ provide: token, useValue: "first" });

    expect(container.get(token)).toBe("first");

    container.unbindAll();

    expect(() => container.get(token)).toThrow("No provider(s) found");

    container.bind({ provide: token, useValue: "second" });

    expect(container.get(token)).toBe("second");
  });

  it("should resolve the container itself", () => {
    const container = new Container();

    expect(container.get(Container)).toBe(container);
  });
});
