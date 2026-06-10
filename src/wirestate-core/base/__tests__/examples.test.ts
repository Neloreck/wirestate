import { Container } from "../container/container";
import { inject } from "../context";
import { InjectionToken } from "../tokens";

class OtherService {
  public getMessage(): string {
    return "test";
  }
}

class MyService {
  private readonly otherService2 = inject(OtherService);

  public constructor(private readonly otherService = inject(OtherService)) {}

  public sayHello(): string {
    return `Constructor injection ${this.otherService.getMessage()}`;
  }

  public sayHello2(): string {
    return `Initializer injection ${this.otherService2.getMessage()}`;
  }

  public triggerInject(): void {
    inject(OtherService);
  }
}

interface Foo {
  foo: string;
}

describe("Container", () => {
  it("should bind classes", () => {
    const container = new Container();

    container
      .bind({
        token: MyService,
        type: "Instance",
        value: MyService,
      })
      .bind({
        token: OtherService,
        type: "Instance",
        value: OtherService,
      });

    const service = container.get(MyService);

    expect(service.sayHello()).toBe("Constructor injection test");
  });

  it("should allow initializer injection", () => {
    const container = new Container();

    container
      .bind({ token: MyService, type: "Instance", value: MyService })
      .bind({ token: OtherService, type: "Instance", value: OtherService });

    const service = container.get(MyService);

    expect(service.sayHello2()).toBe("Initializer injection test");
  });

  it("should not allow injection outside injection context", () => {
    const container = new Container();

    container
      .bind({ token: MyService, type: "Instance", value: MyService })
      .bind({ token: OtherService, type: "Instance", value: OtherService });

    const service = container.get(MyService);

    expect(() => service.triggerInject()).toThrow("You can only invoke inject() within an injection context");
  });

  it("should support all kinds of providers", () => {
    const container = new Container();
    const factoryFn = jest.fn(() => ({ foo: "factory" }));

    const fooToken1 = new InjectionToken<Foo>("foo-token1");
    const fooToken2 = new InjectionToken<Foo>("foo-token2");
    const fooToken3 = new InjectionToken<Foo>("foo-token3");
    const tokenWithoutProvider = new InjectionToken<Foo>("not-provided");

    container
      .bind({
        token: "by-value-with-token-as-string",
        value: { foo: "value" },
      })
      .bind({
        token: fooToken1,
        factory: factoryFn,
      })
      .bind({
        token: fooToken2,
        factory: () => ({ foo: `${inject<Foo>(fooToken1).foo}-with-inject` }),
      })
      .bind({
        token: fooToken3,
        service: fooToken1,
      });

    expect(container.get<Foo>("by-value-with-token-as-string")).toEqual({ foo: "value" });
    expect(container.get(fooToken1)).toEqual({ foo: "factory" });
    expect(container.get(fooToken1)).toBe(container.get(fooToken1));
    expect(factoryFn).toHaveBeenCalledTimes(1);
    expect(container.get(fooToken2)).toEqual({ foo: "factory-with-inject" });
    expect(container.get(fooToken3)).toBe(container.get(fooToken1));
    expect(container.get(tokenWithoutProvider, { optional: true })).toBeUndefined();
    expect(() => container.get(tokenWithoutProvider)).toThrow("No binding(s) found");
  });

  it("should support multi-providers", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    class FooService extends AbstractService {
      public constructor() {
        super("Foo");
      }
    }

    class BarService extends AbstractService {
      public constructor() {
        super("Bar");
      }
    }

    const container = new Container();

    container
      .bind({
        token: AbstractService,
        multi: true,
        type: "Instance",
        value: FooService,
      })
      .bind({
        token: AbstractService,
        multi: true,
        type: "Instance",
        value: BarService,
      });

    const services = container.get(AbstractService, { multi: true });

    expect(services).toBeDefined();
    expect(services).toHaveLength(2);

    const [serviceA, serviceB] = services;

    expect(serviceA).toBeInstanceOf(FooService);
    expect(serviceB).toBeInstanceOf(BarService);
  });

  describe("should support multi-providers with multi-inheritance", () => {
    abstract class AbstractService {
      protected constructor(private name: string) {}
    }

    class FooService extends AbstractService {
      public constructor() {
        super("Foo");
      }
    }

    class BarService extends AbstractService {
      public constructor(public barProp: string) {
        super("Bar");
      }
    }

    class SpecialBarService extends BarService {
      public constructor(public age = 6) {
        super("SpecialBar");
      }
    }

    class BazService extends AbstractService {
      public constructor(public bazProp: string) {
        super("Bar");
      }
    }

    class SpecialBazService extends BazService {
      public constructor(public specialBazProp: string) {
        super("SpecialBaz");
      }
    }

    it("first parent class, then child class ", () => {
      const container = new Container();

      container
        .bind({
          token: FooService,
          type: "Instance",
          value: FooService,
          multi: true,
        })
        .bind({
          token: BarService,
          type: "Instance",
          value: BarService,
          multi: true,
        })
        .bind({
          token: SpecialBarService,
          type: "Instance",
          value: SpecialBarService,
          multi: true,
        })
        .bind({
          token: SpecialBazService,
          type: "Instance",
          value: SpecialBazService,
          multi: true,
        })
        // required: parent class tokens resolve only through explicit service redirections
        .bind({
          token: BarService,
          service: SpecialBarService,
          multi: true,
        })
        .bind({
          token: BazService,
          service: SpecialBazService,
          multi: true,
        })
        .bind({
          token: AbstractService,
          service: FooService,
          multi: true,
        })
        .bind({
          token: AbstractService,
          service: BarService,
          multi: true,
        })
        .bind({
          token: AbstractService,
          service: BazService,
          multi: true,
        });

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).toBeDefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).toBeDefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesBar).toBe(abstractServiceBar);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(barServicesSpecialBar).toBe(abstractServiceSpecialBar);

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).toBeDefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(barServiceSpecialBaz).toBe(abstractServiceSpecialBaz);
    });

    it("first child class, then parent class ", () => {
      const container = new Container();

      container
        .bind({
          token: FooService,
          type: "Instance",
          value: FooService,
          multi: true,
        })
        .bind({
          token: BarService,
          type: "Instance",
          value: BarService,
          multi: true,
        })
        .bind({
          token: SpecialBarService,
          type: "Instance",
          value: SpecialBarService,
          multi: true,
        })
        .bind({
          token: SpecialBazService,
          type: "Instance",
          value: SpecialBazService,
          multi: true,
        })
        // required: parent class tokens resolve only through explicit service redirections
        .bind({
          token: AbstractService,
          service: FooService,
          multi: true,
        })
        .bind({
          token: AbstractService,
          service: BarService,
          multi: true,
        })
        .bind({
          token: AbstractService,
          service: BazService,
          multi: true,
        })
        .bind({
          token: BarService,
          service: SpecialBarService,
          multi: true,
        })
        .bind({
          token: BazService,
          service: SpecialBazService,
          multi: true,
        });

      const bazServices = container.get(BazService, { multi: true });

      expect(bazServices).toBeDefined();
      expect(bazServices).toHaveLength(1);

      const [barServiceSpecialBaz] = bazServices;

      expect(barServiceSpecialBaz).toBeInstanceOf(SpecialBazService);

      const barServices = container.get(BarService, { multi: true });

      expect(barServices).toBeDefined();
      expect(barServices).toHaveLength(2);

      const [barServicesBar, barServicesSpecialBar] = barServices;

      expect(barServicesBar).toBeInstanceOf(BarService);
      expect(barServicesSpecialBar).toBeInstanceOf(SpecialBarService);

      const abstractServices = container.get(AbstractService, { multi: true });

      expect(abstractServices).toBeDefined();
      expect(abstractServices).toHaveLength(4);

      const [abstractServiceFoo, abstractServiceBar, abstractServiceSpecialBar, abstractServiceSpecialBaz] =
        abstractServices;

      expect(abstractServiceFoo).toBeInstanceOf(FooService);
      expect(abstractServiceBar).toBeInstanceOf(BarService);
      expect(abstractServiceBar).toBe(barServicesBar);
      expect(abstractServiceSpecialBar).toBeInstanceOf(SpecialBarService);
      expect(abstractServiceSpecialBar).toBe(barServicesSpecialBar);
      expect(abstractServiceSpecialBaz).toBeInstanceOf(SpecialBazService);
      expect(abstractServiceSpecialBaz).toBe(barServiceSpecialBaz);
    });
  });

  it("should not allow combination of multi=false and multi=true", () => {
    const container = new Container();

    expect(() => container.bind({ token: "key", value: 1 }).bind({ token: "key", multi: true, value: 2 })).toThrow(
      "Cannot bind key as multi-binding, since there is already a binding which is not a multi-binding."
    );

    expect(() =>
      container.bind({ token: "otherKey", multi: true, value: 2 }).bind({ token: "otherKey", value: 1 })
    ).toThrow("Cannot bind otherKey as binding, since there are already binding(s) that are multi-bindings.");
  });

  it("existing provider may not refer to itself", () => {
    const container = new Container();

    expect(() => container.bind({ token: "key", service: "key" })).toThrow(
      "The service redirection for token key cannot refer to itself."
    );
  });

  it("requesting single value for multiple providers throws error", () => {
    const container = new Container();

    container.bind({ token: "key", multi: true, value: 1 }).bind({ token: "key", multi: true, value: 2 });

    expect(() => container.get("key")).toThrow("Requesting a single value for key, but multiple values were provided.");
  });

  it("should support flattening multi-providers (combination of multi and use-existing)", () => {
    const container = new Container();

    container
      .bind({
        token: "myNumbers",
        value: 1,
        multi: true,
      })
      .bind({
        token: "myNumbers",
        value: 2,
        multi: true,
      })
      .bind({
        token: "otherNumber",
        value: 3,
      })
      .bind({
        token: "anotherNumber",
        value: 4,
      })
      .bind({
        token: "otherNumbers",
        value: 5,
        multi: true,
      })
      .bind({
        token: "a",
        service: "myNumbers",
      })
      .bind({
        token: "b",
        service: "myNumbers",
        multi: true,
      })
      .bind({
        token: "b",
        service: "otherNumber",
        multi: true,
      })
      .bind({
        token: "c",
        service: "anotherNumber",
        multi: true,
      })
      .bind({
        token: "d",
        service: "myNumbers",
        multi: true,
      })
      .bind({
        token: "d",
        service: "otherNumbers",
        multi: true,
      })
      .bind({
        token: "d",
        service: "otherNumber",
        multi: true,
      })
      .bind({
        token: "e",
        service: "otherNumber",
        multi: true,
      })
      .bind({
        token: "f",
        service: "otherNumbers",
        multi: true,
      });

    // my numbers
    expect(() => container.get("myNumbers")).toThrow("multiple values were provided");
    expect(container.get("myNumbers", { multi: true })).toEqual([1, 2]);

    // a
    expect(() => container.get("a")).toThrow("multiple values were provided");
    expect(container.get("a", { multi: true })).toEqual([1, 2]);

    // b
    expect(() => container.get("b")).toThrow("multiple values were provided");
    expect(container.get("b", { multi: true })).toEqual([1, 2, 3]);

    // c
    expect(container.get("c")).toBe(4);
    expect(container.get("c", { multi: true })).toEqual([4]);

    // d
    expect(() => container.get("d")).toThrow("multiple values were provided");
    expect(container.get("d", { multi: true })).toEqual([1, 2, 5, 3]);

    // e
    expect(container.get("e")).toBe(3);
    expect(container.get("e", { multi: true })).toEqual([3]);

    // f
    expect(container.get("f")).toBe(5);
    expect(container.get("f", { multi: true })).toEqual([5]);
  });

  it("should support initialization injection", () => {
    class Foo {
      public sayHi(): string {
        return "Hi!";
      }
    }

    class Bar {
      private foo = inject(Foo);

      public letFooSayHi(): string {
        return this.foo.sayHi();
      }
    }

    const container = new Container();

    container.bind({ token: Foo, type: "Instance", value: Foo }).bind({ token: Bar, type: "Instance", value: Bar });

    const bar = container.get(Bar);

    expect(bar.letFooSayHi()).toBe("Hi!");
  });

  it("should support symbols", () => {
    const container = new Container();
    const OTHER_TOKEN = Symbol("other-token");

    container
      .bind({
        token: Symbol.for("my-token"),
        value: 42,
      })
      .bind({
        token: OTHER_TOKEN,
        value: 2,
      });

    expect(container.get(Symbol.for("my-token"))).toBe(42);
    expect(() => container.get(Symbol.for("other-token"))).toThrow("No binding(s) found for other-token");
    expect(container.get(OTHER_TOKEN)).toBe(2);
  });

  it("should throw user-friendly error for circular dependencies", () => {
    class App {
      private foo = inject(Foo);
    }

    class Foo {
      private bar = inject(Bar);

      public lorem(): string {
        return this.bar.lorem();
      }

      public ipsum(): string {
        return this.bar.ipsum();
      }
    }

    class Bar {
      private baz = inject(Baz);

      public lorem(): string {
        return "lorem";
      }

      public ipsum(): string {
        return this.baz.ipsum();
      }
    }

    class Baz {
      private foo = inject(Foo);

      public lorem(): string {
        return this.foo.lorem();
      }

      public ipsum(): string {
        return "ipsum";
      }
    }

    const container = new Container();

    container
      .bind({ token: App, type: "Instance", value: App })
      .bind({ token: Foo, type: "Instance", value: Foo })
      .bind({ token: Bar, type: "Instance", value: Bar })
      .bind({ token: Baz, type: "Instance", value: Baz });

    expect(() => container.get(App)).toThrow("Detected circular dependency: App -> Foo -> Bar -> Baz -> Foo");
  });

  it("should support circular dependencies with lazy providers", () => {
    class Foo {
      private bar = inject(Bar);

      public lorem(): string {
        return this.bar.lorem();
      }

      public ipsum(): string {
        return this.bar.ipsum();
      }
    }

    class Bar {
      private baz = inject(Baz);

      public lorem(): string {
        return "lorem";
      }

      public ipsum(): string {
        return this.baz.ipsum();
      }
    }

    class Baz {
      private foo = inject(Foo, { lazy: true });

      public lorem(): string {
        return this.foo().lorem();
      }

      public ipsum(): string {
        return "ipsum";
      }
    }

    const container = new Container();

    container
      .bind({ token: Foo, type: "Instance", value: Foo })
      .bind({ token: Bar, type: "Instance", value: Bar })
      .bind({ token: Baz, type: "Instance", value: Baz });

    const foo = container.get(Foo);
    const baz = container.get(Baz);

    expect(foo).toBeTruthy();
    expect(baz).toBeTruthy();

    expect(foo.lorem()).toBe("lorem");
    expect(foo.ipsum()).toBe("ipsum");

    expect(baz.lorem()).toBe("lorem");
    expect(baz.ipsum()).toBe("ipsum");
  });
});
