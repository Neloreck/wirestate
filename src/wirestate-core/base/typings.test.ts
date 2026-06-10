/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { Container } from "./container";
import { inject } from "./context";
import type { ClassProvider, ConstructorProvider, ExistingProvider, FactoryProvider, ValueProvider } from "./providers";
import { InjectionToken } from "./tokens";

describe("Type-safety", () => {
  describe("Providers API", () => {
    class FooService {
      private x = Math.random();
    }

    class FooChildService extends FooService {
      private y = Math.random();
    }

    class OtherService {
      private z = Math.random();
    }

    it("constructor provider", () => {
      const a: ConstructorProvider<FooService> = FooService;
      const b: ConstructorProvider<FooService> = FooChildService;

      // @ts-expect-error
      const c: ConstructorProvider<FooService> = OtherService;
      // @ts-expect-error
      const d: ConstructorProvider<FooService> = 3;
    });

    it("class provider", () => {
      const a: ClassProvider<FooService> = { provide: FooService, useClass: FooService };
      const b: ClassProvider<FooService> = { provide: FooService, useClass: FooChildService };

      // @ts-expect-error
      const c: ClassProvider<FooService> = { provide: FooService, useClass: OtherService };
      // @ts-expect-error
      const d: ClassProvider<FooChildService> = { provide: FooChildService, useClass: FooService };
      // @ts-expect-error
      const e: ClassProvider<FooService> = { provide: FooService, useClass: 3 };
      // @ts-expect-error
      const f: ClassProvider<FooService> = { provide: 3, useClass: 3 };
      // @ts-expect-error
      const g: ClassProvider<string> = { provide: String, useClass: String };
    });

    it("value provider", () => {
      const a: ValueProvider<FooService> = { provide: FooService, useValue: new FooService() };
      const b: ValueProvider<FooService> = { provide: FooService, useValue: new FooChildService() };

      // @ts-expect-error
      const c: ValueProvider<FooService> = { provide: FooService, useValue: new OtherService() };
      // @ts-expect-error
      const d: ValueProvider<FooChildService> = { provide: FooChildService, useValue: new FooService() };
      // @ts-expect-error
      const e: ValueProvider<FooService> = { provide: FooService, useValue: 3 };
      // @ts-expect-error
      const f: ValueProvider<FooService> = { provide: 3, useValue: 3 };
      // @ts-expect-error
      const g: ValueProvider<string> = { provide: String, useValue: "foo" };
    });

    it("factory provider", () => {
      const a: FactoryProvider<FooService> = { provide: FooService, useFactory: () => new FooService() };
      const b: FactoryProvider<FooService> = { provide: FooService, useFactory: () => new FooChildService() };

      // @ts-expect-error
      const a2: FactoryProvider<FooService> = { provide: FooService, useFactory: async () => new FooService() };
      // @ts-expect-error
      const b2: FactoryProvider<FooService> = { provide: FooService, useFactory: async () => new FooChildService() };

      // @ts-expect-error
      const c: FactoryProvider<FooService> = { provide: FooService, useFactory: () => new OtherService() };
      // @ts-expect-error
      const d: FactoryProvider<FooChildService> = { provide: FooChildService, useFactory: () => new FooService() };
      // @ts-expect-error
      const e: FactoryProvider<FooService> = { provide: FooService, useFactory: () => 3 };
      // @ts-expect-error
      const f: FactoryProvider<FooService> = { provide: 3, useFactory: () => 3 };
      // @ts-expect-error
      const g: FactoryProvider<string> = { provide: String, useFactory: () => "foo" };
    });

    it("existing factory provider", () => {
      const a: ExistingProvider<FooService> = { provide: FooService, useExisting: FooService };
      const b: ExistingProvider<FooService> = { provide: FooService, useExisting: FooChildService };

      const token1 = new InjectionToken<FooService>("token1");
      const token2 = new InjectionToken<FooChildService>("token2");
      const token3 = new InjectionToken<OtherService>("token3");

      const a2: ExistingProvider<FooService> = { provide: FooService, useExisting: token1 };
      const b2: ExistingProvider<FooService> = { provide: FooService, useExisting: token2 };
      const b3: ExistingProvider<FooService> = { provide: FooService, useExisting: "unknown" };

      // @ts-expect-error
      const c: ExistingProvider<FooService> = { provide: FooService, useExisting: OtherService };
      // @ts-expect-error
      const c2: ExistingProvider<FooService> = { provide: FooService, useExisting: token3 };
      // @ts-expect-error
      const d: ExistingProvider<FooChildService> = { provide: FooChildService, useExisting: FooService };
      // @ts-expect-error
      const e: ExistingProvider<FooService> = { provide: 3, useExisting: 3 };
    });
  });
  describe("Binding", () => {
    class FooService {
      private x = Math.random();
    }

    class FooChildService extends FooService {
      private y = Math.random();
    }

    const TOKEN1 = new InjectionToken<string>("token1");
    const TOKEN2 = new InjectionToken<number>("token2");

    it("bind()", () => {
      const container = new Container();

      container.bind({ provide: FooService, useClass: FooChildService });
      container.bind({ provide: FooChildService, useClass: FooChildService });

      // @ts-expect-error
      container.bind({ provide: FooChildService, useClass: FooService });

      container.bind({ provide: TOKEN1, useValue: "Foo" });
      container.bind({ provide: TOKEN2, useValue: 42 });

      // @ts-expect-error
      container.bind({ provide: TOKEN1, useValue: 42 });
      // @ts-expect-error
      container.bind({ provide: TOKEN2, useValue: "Foo" });
    });

    it("bindAll()", () => {
      const container = new Container();

      container.bindAll(
        { provide: FooService, useClass: FooChildService },
        { provide: FooChildService, useClass: FooChildService }
      );

      // @ts-expect-error
      container.bindAll({ provide: FooChildService, useClass: FooService });

      // 2 params
      container.bindAll({ provide: TOKEN1, useValue: "Foo" }, { provide: TOKEN2, useValue: 42 });
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" }
      );

      // 3 params
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" }
      );
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" }
      );

      // 4 params
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 }
      );
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 }
      );

      // 5 params
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" }
      );
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" }
      );

      // 6 params
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 }
      );
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 }
      );

      // 10 params
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 }
      );
      container.bindAll(
        { provide: TOKEN1, useValue: "Foo" },
        // @ts-expect-error
        { provide: TOKEN2, useValue: "Foo" },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: 42 },
        { provide: TOKEN1, useValue: "Foo" },
        { provide: TOKEN2, useValue: "Foo" } // not type-checking (10th params)
      );

      // @ts-expect-error
      container.bindAll({ provide: TOKEN1, useValue: 42 });
      // @ts-expect-error
      container.bindAll({ provide: TOKEN2, useValue: "Foo" });
    });
  });
  it("Injection tokens", () => {
    const SOME_NUMBER = new InjectionToken<number>("SOME_NUMBER");
    const SOME_STRING = new InjectionToken<string>("SOME_STRING");

    const container = new Container();

    container.bind({ provide: SOME_NUMBER, useValue: 3 });
    // @ts-expect-error
    container.bind({ provide: SOME_NUMBER, useValue: "foo" });
    container.bind({ provide: SOME_STRING, useValue: "foo" });
    // @ts-expect-error
    container.bind({ provide: SOME_STRING, useValue: 3 });
  });
  describe("Injecting", () => {
    class FooService {
      private x = 5;
    }

    class FooChildService extends FooService {
      private y = Math.random();
    }

    it("inject()", () => {
      class Foo {
        private a = inject(FooService) satisfies FooService;
        private b = inject(FooChildService) satisfies FooService;
        // @ts-expect-error
        private c = inject(FooService) satisfies FooChildService;
        // @ts-expect-error
        private d = inject(FooService) satisfies Promise<FooService>;
        // @ts-expect-error
        private e = inject(FooChildService) satisfies Promise<FooService>;
      }
    });

    it("inject() with multi", () => {
      class Foo {
        private a = inject(FooService, { multi: true }) satisfies Array<FooService>;
        private b = inject(FooChildService, { multi: true }) satisfies Array<FooService>;
        // @ts-expect-error
        private c = inject(FooService, { multi: true }) satisfies Array<FooChildService>;
        // @ts-expect-error
        private d = inject(FooService, { multi: true }) satisfies Promise<Array<FooService>>;
        // @ts-expect-error
        private e = inject(FooChildService, { multi: true }) satisfies Promise<Array<FooService>>;
      }
    });

    it("inject() with optional", () => {
      class Foo {
        private a = inject(FooService, { optional: true }) satisfies FooService | undefined;
        private b = inject(FooChildService, { optional: true }) satisfies FooService | undefined;
        // @ts-expect-error
        private c = inject(FooService, { optional: true }) satisfies FooChildService | undefined;
        // @ts-expect-error
        private d = inject(FooService, { optional: true }) satisfies Promise<FooService | undefined>;
        // @ts-expect-error
        private e = inject(FooChildService, { optional: true }) satisfies Promise<FooService | undefined>;
      }
    });

    it("inject() with optional and multi", () => {
      class Foo {
        private a = inject(FooService, { optional: true, multi: true }) satisfies Array<FooService> | undefined;
        private b = inject(FooChildService, { optional: true, multi: true }) satisfies Array<FooService> | undefined;
        // @ts-expect-error
        private c = inject(FooService, { optional: true, multi: true }) satisfies Array<FooChildService> | undefined;
        // @ts-expect-error
        private d = inject(FooService, { optional: true, multi: true }) satisfies Promise<
          Array<FooService> | undefined
        >;
        private e = inject(FooChildService, {
          optional: true,
          multi: true,
          // @ts-expect-error
        }) satisfies Promise<Array<FooService> | undefined>;
      }
    });
  });
});
