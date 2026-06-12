import { InjectionToken } from "../binding/binding-tokens";
import { ContainerKernel } from "../container/container-kernel";
import { inject } from "../container/context";
import { Injectable } from "../metadata/injectable";

@Injectable()
class OtherService {
  public getMessage(): string {
    return "test";
  }
}

@Injectable()
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

describe("ContainerKernel", () => {
  it("should bind classes", () => {
    const container = new ContainerKernel();

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
    const container = new ContainerKernel();

    container
      .bind({ token: MyService, type: "Instance", value: MyService })
      .bind({ token: OtherService, type: "Instance", value: OtherService });

    const service = container.get(MyService);

    expect(service.sayHello2()).toBe("Initializer injection test");
  });

  it("should not allow injection outside injection context", () => {
    const container = new ContainerKernel();

    container
      .bind({ token: MyService, type: "Instance", value: MyService })
      .bind({ token: OtherService, type: "Instance", value: OtherService });

    const service = container.get(MyService);

    expect(() => service.triggerInject()).toThrow("You can only invoke inject() within an injection context");
  });

  it("should support all kinds of providers", () => {
    const container = new ContainerKernel();
    const factoryFn = jest.fn(() => ({ foo: "factory" }));

    const fooToken1 = new InjectionToken<Foo>("foo-token1");
    const fooToken2 = new InjectionToken<Foo>("foo-token2");
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
      });

    expect(container.get<Foo>("by-value-with-token-as-string")).toEqual({ foo: "value" });
    expect(container.get(fooToken1)).toEqual({ foo: "factory" });
    expect(container.get(fooToken1)).toBe(container.get(fooToken1));
    expect(factoryFn).toHaveBeenCalledTimes(1);
    expect(container.get(fooToken2)).toEqual({ foo: "factory-with-inject" });
    expect(container.get(tokenWithoutProvider, { optional: true })).toBeUndefined();
    expect(() => container.get(tokenWithoutProvider)).toThrow("No binding(s) found");
  });

  it("should support initialization injection", () => {
    @Injectable()
    class Foo {
      public sayHi(): string {
        return "Hi!";
      }
    }

    @Injectable()
    class Bar {
      private foo = inject(Foo);

      public letFooSayHi(): string {
        return this.foo.sayHi();
      }
    }

    const container = new ContainerKernel();

    container.bind({ token: Foo, type: "Instance", value: Foo }).bind({ token: Bar, type: "Instance", value: Bar });

    const bar = container.get(Bar);

    expect(bar.letFooSayHi()).toBe("Hi!");
  });

  it("should support symbols", () => {
    const container = new ContainerKernel();
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
    expect(() => container.get(Symbol.for("other-token"))).toThrow("No binding(s) found for 'other-token'");
    expect(container.get(OTHER_TOKEN)).toBe(2);
  });

  it("should throw user-friendly error for circular dependencies", () => {
    @Injectable()
    class App {
      private foo = inject(Foo);
    }

    @Injectable()
    class Foo {
      private bar = inject(Bar);

      public lorem(): string {
        return this.bar.lorem();
      }

      public ipsum(): string {
        return this.bar.ipsum();
      }
    }

    @Injectable()
    class Bar {
      private baz = inject(Baz);

      public lorem(): string {
        return "lorem";
      }

      public ipsum(): string {
        return this.baz.ipsum();
      }
    }

    @Injectable()
    class Baz {
      private foo = inject(Foo);

      public lorem(): string {
        return this.foo.lorem();
      }

      public ipsum(): string {
        return "ipsum";
      }
    }

    const container = new ContainerKernel();

    container
      .bind({ token: App, type: "Instance", value: App })
      .bind({ token: Foo, type: "Instance", value: Foo })
      .bind({ token: Bar, type: "Instance", value: Bar })
      .bind({ token: Baz, type: "Instance", value: Baz });

    expect(() => container.get(App)).toThrow("Detected circular dependency: App -> Foo -> Bar -> Baz -> Foo");
  });

  it("should support circular dependencies with lazy providers", () => {
    @Injectable()
    class Foo {
      private bar = inject(Bar);

      public lorem(): string {
        return this.bar.lorem();
      }

      public ipsum(): string {
        return this.bar.ipsum();
      }
    }

    @Injectable()
    class Bar {
      private baz = inject(Baz);

      public lorem(): string {
        return "lorem";
      }

      public ipsum(): string {
        return this.baz.ipsum();
      }
    }

    @Injectable()
    class Baz {
      private foo = inject(Foo, { lazy: true });

      public lorem(): string {
        return this.foo().lorem();
      }

      public ipsum(): string {
        return "ipsum";
      }
    }

    const container = new ContainerKernel();

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
