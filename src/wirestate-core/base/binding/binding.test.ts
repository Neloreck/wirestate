import { Container } from "../container/container";
import { inject } from "../context";
import { InjectionToken } from "../tokens";

const myServiceConstructorSpy = jest.fn();

class MyService {
  public constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Bindings", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("Instance bindings should reject re-binding once constructed", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrow("No binding(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind({
      token: MyService,
      type: "Instance",
      value: MyService,
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);

    expect(() => container.bind({ token: MyService, type: "Instance", value: MyService })).toThrow(
      "existing binding was already constructed"
    );
  });

  it("Instance bindings should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrow("No binding(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind({
      token: MyService,
      type: "Instance",
      value: MyService,
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Constant value bindings should be provided", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrow("No binding(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    const myService = new MyService();

    container.bind({
      token: MyService,
      value: myService,
    });

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Dynamic value bindings should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrow("No binding(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    container.bind({
      token: MyService,
      factory: () => new MyService(),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(container.get(MyService, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Service redirections should be provided once", () => {
    const container = new Container();

    expect(() => container.get(MyService)).toThrow("No binding(s) found");
    expect(container.get(MyService, { optional: true })).toBeUndefined();

    const OTHER_TOKEN = new InjectionToken<MyService>("MyService");

    container.bind({ token: MyService, type: "Instance", value: MyService });
    container.bind({
      token: OTHER_TOKEN,
      service: MyService,
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();

    const myService = container.get(OTHER_TOKEN);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(OTHER_TOKEN)).toBe(myService);
    expect(container.get(OTHER_TOKEN, { optional: true })).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  describe("abstract classes and inheritance", () => {
    it("should support binding subclasses", () => {
      abstract class AbstractService {
        protected constructor(public name = "AbstractService") {}
      }

      class FooService extends AbstractService {
        public constructor(public fooProp = "foo") {
          super("FooService");
        }
      }

      class BarService extends AbstractService {
        public constructor(public fooProp = "bar") {
          super("BarService");
        }
      }

      const container = new Container();

      container
        .bind({ token: FooService, type: "Instance", value: FooService })
        .bind({ token: BarService, type: "Instance", value: BarService })
        .bind({
          token: AbstractService,
          service: FooService,
        });

      expect(container.get(FooService)).toBeInstanceOf(FooService);
      expect(container.get(FooService)).toBeInstanceOf(AbstractService);
      expect(container.get(BarService)).toBeInstanceOf(BarService);
      expect(container.get(BarService)).toBeInstanceOf(AbstractService);

      // resolving the parent class token works only because of the explicit service redirection above
      expect(container.get(AbstractService)).toBeInstanceOf(FooService);
    });
  });

  describe("Multi-binding injection", () => {
    it("should support multi-value bindings", () => {
      const container = new Container();

      const TOKEN = new InjectionToken<number>("TOKEN");
      const OTHER_TOKEN = new InjectionToken<number>("OTHER_TOKEN");

      container
        .bind({
          token: TOKEN,
          multi: true,
          value: 1,
        })
        .bind({
          token: TOKEN,
          multi: true,
          value: 2,
        });

      expect(container.get(TOKEN, { multi: true })).toEqual([1, 2]);
      expect(() => container.get(OTHER_TOKEN, { multi: true })).toThrow("No binding(s) found");
      expect(container.get(OTHER_TOKEN, { multi: true, optional: true })).toBeUndefined();

      expect(() => {
        container.bind({
          token: TOKEN,
          multi: true,
          value: 1,
        });
      }).toThrow("already constructed");
    });
  });

  it("should pass the container to the factory", () => {
    const container = new Container();
    const fooFactory = jest.fn(() => "Foo");
    const barFactory = jest.fn(() => "Bar");

    container
      .bind({
        token: "foo",
        factory: fooFactory,
      })
      .bind({
        token: "bar",
        factory: barFactory,
      })
      .bind({
        token: "message",
        factory: (c) => {
          return `${c.get("foo")} ${c.get("bar")}`;
        },
      });

    expect(container.get("message")).toBe("Foo Bar");
    expect(fooFactory).toHaveBeenCalledTimes(1);
    expect(barFactory).toHaveBeenCalledTimes(1);
  });

  it("should bind the container itself", () => {
    const container = new Container();

    const fooFactory = jest.fn(() => "Foo");
    const barFactory = jest.fn(() => "Bar");

    container
      .bind({
        token: "foo",
        factory: fooFactory,
      })
      .bind({
        token: "bar",
        factory: barFactory,
      })
      .bind({
        token: "message",
        factory: () => {
          const c = inject(Container);

          return `${c.get("foo")} ${c.get("bar")}`;
        },
      });

    expect(container.get("message")).toBe("Foo Bar");
    expect(fooFactory).toHaveBeenCalledTimes(1);
    expect(barFactory).toHaveBeenCalledTimes(1);
  });

  describe("Child containers", () => {
    it("should be able to provide services provided on one of their ancestors", () => {
      const parent = new Container();
      const child = new Container(parent);
      const grandChild = new Container(child);

      parent.bind({ token: "tokenA", factory: () => ["a"] });
      child.bind({ token: "tokenB", factory: () => ["b"] });
      grandChild.bind({ token: "tokenC", factory: () => ["c"] });

      expect(grandChild.get("tokenA")).toEqual(["a"]);
      expect(grandChild.get("tokenB")).toEqual(["b"]);
      expect(grandChild.get("tokenC")).toEqual(["c"]);

      expect(child.get("tokenA")).toEqual(["a"]);
      expect(child.get("tokenB")).toEqual(["b"]);
      expect(() => child.get("tokenC")).toThrow("No binding(s) found for tokenC");

      expect(parent.get("tokenA")).toEqual(["a"]);
      expect(() => parent.get("tokenB")).toThrow("No binding(s) found for tokenB");
      expect(() => child.get("tokenC")).toThrow("No binding(s) found for tokenC");
    });

    it("should reuse singletons from their parent", () => {
      const parent = new Container();
      const child = new Container(parent);
      const grandChild = new Container(child);

      parent.bind({ token: "tokenA", factory: () => ["a"] });
      child.bind({ token: "tokenB", factory: () => ["b"] });

      const a1 = parent.get("tokenA");
      const a2 = grandChild.get("tokenA");
      const a3 = child.get("tokenA");

      const b1 = child.get("tokenB");
      const b2 = grandChild.get("tokenB");

      expect(a1).toBe(a2);
      expect(a2).toBe(a3);

      expect(b1).toBe(b2);
    });

    it("should not share their services with their parent", () => {
      const parent = new Container();
      const child = new Container(parent);

      child.bind({ token: "tokenA", factory: () => ["a"] });

      expect(child.get("tokenA")).toEqual(["a"]);
      expect(() => parent.get("tokenA")).toThrow("No binding(s) found for tokenA");
    });

    it("should keep track of their own singletons if provider was overridden", () => {
      const parent = new Container();
      const child = new Container(parent);
      const grandChild = new Container(child);

      parent.bind({ token: "tokenA", factory: () => ["a1"] });
      child.bind({ token: "tokenA", factory: () => ["a2"] });

      expect(parent.get("tokenA")).toEqual(["a1"]);
      expect(child.get("tokenA")).toEqual(["a2"]);
      expect(grandChild.get("tokenA")).toEqual(["a2"]);
    });

    it("should not merge multi-providers with their parents", () => {
      const parent = new Container();
      const child = new Container(parent);

      parent
        .bind({ token: "tokenA", factory: () => "a1", multi: true })
        .bind({ token: "tokenA", factory: () => "a2", multi: true });

      child
        .bind({ token: "tokenA", factory: () => "a3", multi: true })
        .bind({ token: "tokenA", factory: () => "a4", multi: true });

      expect(parent.get("tokenA", { multi: true })).toEqual(["a1", "a2"]);
      expect(child.get("tokenA", { multi: true })).toEqual(["a3", "a4"]);
    });
  });

  describe("Lazy injection", () => {
    it("should construct lazily and once", () => {
      const barConstructed = jest.fn();
      const otherConstructed = jest.fn();

      class OtherService {
        public constructor() {
          otherConstructed();
        }
      }

      class BarService {
        public constructor(private readonly otherService = inject(OtherService)) {
          barConstructed();
        }

        public getBar(): string {
          return "Bar!";
        }
      }

      class FooService {
        public constructor(private readonly barService = inject(BarService, { lazy: true })) {}

        public doSomething(): string {
          return this.barService().getBar();
        }
      }

      const container = new Container();

      container
        .bind({ token: OtherService, type: "Instance", value: OtherService })
        .bind({ token: BarService, type: "Instance", value: BarService })
        .bind({ token: FooService, type: "Instance", value: FooService });

      const fooService = container.get(FooService);

      expect(barConstructed).not.toHaveBeenCalled();
      expect(otherConstructed).not.toHaveBeenCalled();

      const result = fooService.doSomething();

      expect(barConstructed).toHaveBeenCalled();
      expect(otherConstructed).toHaveBeenCalled();

      expect(result).toBe("Bar!");

      fooService.doSomething();

      expect(barConstructed).toHaveBeenCalledTimes(1);
      expect(otherConstructed).toHaveBeenCalledTimes(1);
    });

    it("should work with optionals", () => {
      class BarService {
        public getBar(): string {
          return "Bar!";
        }
      }

      class FooService {
        public constructor(private readonly barService = inject(BarService, { lazy: true, optional: true })) {}

        public doSomething(): string | undefined {
          return this.barService()?.getBar();
        }
      }

      const container = new Container();

      container.bind({ token: FooService, type: "Instance", value: FooService });

      const fooService = container.get(FooService);

      expect(fooService.doSomething()).toBeUndefined();
    });

    it("inject() should fail outside injection context", () => {
      class FooService {}

      expect(() => inject(FooService, { lazy: true })).toThrow(
        "You can only invoke inject() within an injection context"
      );
    });
  });
});
