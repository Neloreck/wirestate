import { inject } from "../container/container-context";
import { ContainerKernel } from "../container/container-kernel";
import { Injectable } from "../metadata/metadata-injectable";
import { type Optional } from "../types/general";

const myServiceConstructorSpy = jest.fn();

@Injectable()
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
    const container = new ContainerKernel();

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
    const container = new ContainerKernel();

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
    const container = new ContainerKernel();

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
    const container = new ContainerKernel();

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

  it("should pass the container to the factory", () => {
    const container = new ContainerKernel();
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

  describe("Child containers", () => {
    it("should be able to provide services provided on one of their ancestors", () => {
      const parent = new ContainerKernel();
      const child = new ContainerKernel(parent);
      const grandChild = new ContainerKernel(child);

      parent.bind({ token: "tokenA", factory: () => ["a"] });
      child.bind({ token: "tokenB", factory: () => ["b"] });
      grandChild.bind({ token: "tokenC", factory: () => ["c"] });

      expect(grandChild.get("tokenA")).toEqual(["a"]);
      expect(grandChild.get("tokenB")).toEqual(["b"]);
      expect(grandChild.get("tokenC")).toEqual(["c"]);

      expect(child.get("tokenA")).toEqual(["a"]);
      expect(child.get("tokenB")).toEqual(["b"]);
      expect(() => child.get("tokenC")).toThrow("No binding(s) found for 'tokenC'");

      expect(parent.get("tokenA")).toEqual(["a"]);
      expect(() => parent.get("tokenB")).toThrow("No binding(s) found for 'tokenB'");
      expect(() => child.get("tokenC")).toThrow("No binding(s) found for 'tokenC'");
    });

    it("should reuse singletons from their parent", () => {
      const parent = new ContainerKernel();
      const child = new ContainerKernel(parent);
      const grandChild = new ContainerKernel(child);

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
      const parent = new ContainerKernel();
      const child = new ContainerKernel(parent);

      child.bind({ token: "tokenA", factory: () => ["a"] });

      expect(child.get("tokenA")).toEqual(["a"]);
      expect(() => parent.get("tokenA")).toThrow("No binding(s) found for 'tokenA'");
    });

    it("should keep track of their own singletons if provider was overridden", () => {
      const parent = new ContainerKernel();
      const child = new ContainerKernel(parent);
      const grandChild = new ContainerKernel(child);

      parent.bind({ token: "tokenA", factory: () => ["a1"] });
      child.bind({ token: "tokenA", factory: () => ["a2"] });

      expect(parent.get("tokenA")).toEqual(["a1"]);
      expect(child.get("tokenA")).toEqual(["a2"]);
      expect(grandChild.get("tokenA")).toEqual(["a2"]);
    });
  });

  describe("Lazy injection", () => {
    it("should construct lazily and once", () => {
      const barConstructed = jest.fn();
      const otherConstructed = jest.fn();

      @Injectable()
      class OtherService {
        public constructor() {
          otherConstructed();
        }
      }

      @Injectable()
      class BarService {
        public constructor(private readonly otherService = inject(OtherService)) {
          barConstructed();
        }

        public getBar(): string {
          return "Bar!";
        }
      }

      @Injectable()
      class FooService {
        public constructor(private readonly barService = inject(BarService, { lazy: true })) {}

        public doSomething(): string {
          return this.barService().getBar();
        }
      }

      const container = new ContainerKernel();

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

      @Injectable()
      class FooService {
        public constructor(private readonly barService = inject(BarService, { lazy: true, optional: true })) {}

        public doSomething(): Optional<string> {
          return this.barService()?.getBar();
        }
      }

      const container = new ContainerKernel();

      container.bind({ token: FooService, type: "Instance", value: FooService });

      const fooService = container.get(FooService);

      expect(fooService.doSomething()).toBeUndefined();
    });

    it("inject() should fail outside injection context for every form, including optional", () => {
      class FooService {}

      const message = "You can only invoke inject() within an injection context";

      expect(() => inject(FooService)).toThrow(message);
      expect(() => inject(FooService, { optional: true })).toThrow(message);
      expect(() => inject(FooService, { lazy: true })).toThrow(message);
      expect(() => inject(FooService, { lazy: true, optional: true })).toThrow(message);
    });
  });
});
