import {
  type SingleMethodDecoratorDescriptor,
  createSingleMethodDecoratorDescriptor,
} from "./metadata-single-method-decorator";

describe("createSingleMethodDecoratorDescriptor", () => {
  const buildLifecycle = (): {
    lifecycle: SingleMethodDecoratorDescriptor;
    registry: WeakMap<object, string | symbol>;
  } => {
    const registry: WeakMap<object, string | symbol> = new WeakMap();
    const lifecycle: SingleMethodDecoratorDescriptor = createSingleMethodDecoratorDescriptor({
      registry,
      name: "OnTest",
      duplicateMessage: (className) => `duplicate on '${className}'.`,
      hierarchyMessage: (className) => `conflict across '${className}'.`,
    });

    return { lifecycle, registry };
  };

  it("should record the decorated method name on the constructor", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
      registry,
    } = buildLifecycle();

    class Service {
      @Decorator()
      public onTest(): void {}
    }

    expect(registry.get(Service)).toBe("onTest");
    expect(getMetadata(new Service())).toBe("onTest");
  });

  it("should return undefined when no method is decorated", () => {
    const {
      lifecycle: { getMetadata },
    } = buildLifecycle();

    class Service {}

    expect(getMetadata(new Service())).toBeUndefined();
  });

  it("should throw the duplicate message when a class declares the hook twice", () => {
    const {
      lifecycle: { decorator: Decorator },
    } = buildLifecycle();

    class Service {
      @Decorator()
      public first(): void {}

      public second(): void {}
    }

    expect(() =>
      Decorator()(Service.prototype, "second", Object.getOwnPropertyDescriptor(Service.prototype, "second")!)
    ).toThrow("duplicate on 'Service'.");
  });

  it("should allow a subclass to redecorate the same method name", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
    } = buildLifecycle();

    class Base {
      @Decorator()
      public onTest(): void {}
    }

    class Child extends Base {
      @Decorator()
      public override onTest(): void {}
    }

    expect(getMetadata(new Child())).toBe("onTest");
  });

  it("should inherit metadata declared only on the base class", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
    } = buildLifecycle();

    class Base {
      @Decorator()
      public onTest(): void {}
    }

    class Child extends Base {}

    expect(getMetadata(new Child())).toBe("onTest");
  });

  it("should throw the hierarchy message when two different methods are decorated across a hierarchy", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
    } = buildLifecycle();

    class Base {
      @Decorator()
      public first(): void {}
    }

    class Child extends Base {
      @Decorator()
      public second(): void {}
    }

    expect(() => getMetadata(new Child())).toThrow("conflict across 'Child'.");
  });

  it("should throw the hierarchy message when a mid-hierarchy class decorates a different method (3 levels)", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
    } = buildLifecycle();

    class Base {
      @Decorator()
      public alpha(): void {}
    }

    class Middle extends Base {
      @Decorator()
      public beta(): void {}
    }

    // Base and Leaf agree on "alpha", but Middle's "beta" still makes the hierarchy ambiguous.
    class Leaf extends Middle {
      @Decorator()
      public override alpha(): void {}
    }

    expect(() => getMetadata(new Leaf())).toThrow("conflict across 'Leaf'.");
  });

  it("should throw when used as a TC39 decorator without a configured metadata key", () => {
    const {
      lifecycle: { decorator: Decorator },
    } = buildLifecycle();

    // A standard (TC39) method context: passes context validation, but the hook
    // was built without a `metadataKey`, so it cannot store standard metadata.
    const context: ClassMethodDecoratorContext = {
      kind: "method",
      name: "onTest",
      static: false,
      private: false,
      metadata: {},
    } as unknown as ClassMethodDecoratorContext;

    expect(() => Decorator()(() => undefined, context)).toThrow(
      "@OnTest() is not configured for TC39 standard decorators: missing metadata key."
    );
  });

  it("should support symbol method keys", () => {
    const {
      lifecycle: { decorator: Decorator, getMetadata },
    } = buildLifecycle();

    const key: unique symbol = Symbol("onTest");

    class Service {
      public [key](): void {}
    }

    Decorator()(Service.prototype, key, Object.getOwnPropertyDescriptor(Service.prototype, key)!);

    expect(getMetadata(new Service())).toBe(key);
  });
});
