import { Container } from "./container";
import { inject } from "./context";
import { InjectionToken } from "./tokens";

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
        provide: MyService,
        useClass: MyService,
      })
      .bind({
        provide: OtherService,
        useClass: OtherService,
      });

    const service = container.get(MyService);

    expect(service.sayHello()).toBe("Constructor injection test");
  });

  it("should allow initializer injection", () => {
    const container = new Container();

    container.bindAll(MyService, OtherService);

    const service = container.get(MyService);

    expect(service.sayHello2()).toBe("Initializer injection test");
  });

  it("should not allow injection outside injection context", () => {
    const container = new Container();

    container.bindAll(MyService, OtherService);

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

    container.bindAll(
      {
        provide: "by-value-with-token-as-string",
        useValue: { foo: "value" },
      },
      {
        provide: fooToken1,
        useFactory: factoryFn,
      },
      {
        provide: fooToken2,
        useFactory: () => ({ foo: `${inject<Foo>(fooToken1).foo}-with-inject` }),
      },
      {
        provide: fooToken3,
        useExisting: fooToken1,
      }
    );

    expect(container.get<Foo>("by-value-with-token-as-string")).toEqual({ foo: "value" });
    expect(container.get(fooToken1)).toEqual({ foo: "factory" });
    expect(container.get(fooToken1)).toBe(container.get(fooToken1));
    expect(factoryFn).toHaveBeenCalledTimes(1);
    expect(container.get(fooToken2)).toEqual({ foo: "factory-with-inject" });
    expect(container.get(fooToken3)).toBe(container.get(fooToken1));
    expect(container.get(tokenWithoutProvider, { optional: true })).toBeUndefined();
    expect(() => container.get(tokenWithoutProvider)).toThrow("No provider(s) found");
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
        provide: AbstractService,
        multi: true,
        useClass: FooService,
      })
      .bind({
        provide: AbstractService,
        multi: true,
        useClass: BarService,
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

      container.bindAll(
        {
          provide: FooService,
          useClass: FooService,
          multi: true,
        },
        {
          provide: BarService,
          useClass: BarService,
          multi: true,
        },
        {
          provide: SpecialBarService,
          useClass: SpecialBarService,
          multi: true,
        },
        {
          provide: SpecialBazService,
          useClass: SpecialBazService,
          multi: true,
        },

        // not needed, but should not interfere with auto-binding of parent classes:
        {
          provide: BarService,
          useExisting: SpecialBarService,
          multi: true,
        },
        {
          provide: BazService,
          useExisting: SpecialBazService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: FooService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BarService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BazService,
          multi: true,
        }
      );

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

      container.bindAll(
        {
          provide: FooService,
          useClass: FooService,
          multi: true,
        },
        {
          provide: BarService,
          useClass: BarService,
          multi: true,
        },
        {
          provide: SpecialBarService,
          useClass: SpecialBarService,
          multi: true,
        },
        {
          provide: SpecialBazService,
          useClass: SpecialBazService,
          multi: true,
        },

        // not needed, but should not interfere with auto-binding of parent classes:
        {
          provide: AbstractService,
          useExisting: FooService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BarService,
          multi: true,
        },
        {
          provide: AbstractService,
          useExisting: BazService,
          multi: true,
        },
        {
          provide: BarService,
          useExisting: SpecialBarService,
          multi: true,
        }
      );

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

    expect(() =>
      container.bindAll({ provide: "key", useValue: 1 }, { provide: "key", multi: true, useValue: 2 })
    ).toThrow("Cannot bind key as multi-provider, since there is already a provider which is not a multi-provider.");

    expect(() =>
      container.bindAll({ provide: "otherKey", multi: true, useValue: 2 }, { provide: "otherKey", useValue: 1 })
    ).toThrow("Cannot bind otherKey as provider, since there are already provider(s) that are multi-providers.");
  });

  it("existing provider may not refer to itself", () => {
    const container = new Container();

    expect(() => container.bind({ provide: "key", useExisting: "key" })).toThrow(
      `The provider for token key with "useExisting" cannot refer to itself.`
    );
  });

  it("requesting single value for multiple providers throws error", () => {
    const container = new Container();

    container.bindAll({ provide: "key", multi: true, useValue: 1 }, { provide: "key", multi: true, useValue: 2 });

    expect(() => container.get("key")).toThrow("Requesting a single value for key, but multiple values were provided.");
  });

  it("should support flattening multi-providers (combination of multi and use-existing)", () => {
    const container = new Container();

    container.bindAll(
      {
        provide: "myNumbers",
        useValue: 1,
        multi: true,
      },
      {
        provide: "myNumbers",
        useValue: 2,
        multi: true,
      },
      {
        provide: "otherNumber",
        useValue: 3,
      },
      {
        provide: "anotherNumber",
        useValue: 4,
      },
      {
        provide: "otherNumbers",
        useValue: 5,
        multi: true,
      },
      {
        provide: "a",
        useExisting: "myNumbers",
      },
      {
        provide: "b",
        useExisting: "myNumbers",
        multi: true,
      },
      {
        provide: "b",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "c",
        useExisting: "anotherNumber",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "myNumbers",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "otherNumbers",
        multi: true,
      },
      {
        provide: "d",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "e",
        useExisting: "otherNumber",
        multi: true,
      },
      {
        provide: "f",
        useExisting: "otherNumbers",
        multi: true,
      }
    );

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

    container.bindAll(Foo, Bar);

    const bar = container.get(Bar);

    expect(bar.letFooSayHi()).toBe("Hi!");
  });

  it("should support symbols", () => {
    const container = new Container();
    const OTHER_TOKEN = Symbol("other-token");

    container.bindAll(
      {
        provide: Symbol.for("my-token"),
        useValue: 42,
      },
      {
        provide: OTHER_TOKEN,
        useValue: 2,
      }
    );

    expect(container.get(Symbol.for("my-token"))).toBe(42);
    expect(() => container.get(Symbol.for("other-token"))).toThrow("No provider(s) found for other-token");
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

    container.bindAll(App, Foo, Bar, Baz);

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

    container.bindAll(Foo, Bar, Baz);

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
