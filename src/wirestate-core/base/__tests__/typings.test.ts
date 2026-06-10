/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import type {
  ConstantValueBindingDescriptor,
  DynamicValueBindingDescriptor,
  InstanceBindingDescriptor,
  ServiceRedirectionBindingDescriptor,
} from "../binding/binding";
import { Container } from "../container/container";
import { inject } from "../context";
import { InjectionToken } from "../tokens";

describe("Type-safety", () => {
  describe("Bindings API", () => {
    class FooService {
      private x = Math.random();
    }

    class FooChildService extends FooService {
      private y = Math.random();
    }

    class OtherService {
      private z = Math.random();
    }

    it("instance binding descriptor", () => {
      const a: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: FooService };
      const b: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: FooChildService };

      // @ts-expect-error
      const c: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: OtherService };
      const d: InstanceBindingDescriptor<FooChildService> = {
        token: FooChildService,
        type: "Instance",
        // @ts-expect-error
        value: FooService,
      };
      // @ts-expect-error
      const e: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: 3 };
      // @ts-expect-error
      const f: InstanceBindingDescriptor<FooService> = { token: 3, type: "Instance", value: 3 };
      // @ts-expect-error
      const g: InstanceBindingDescriptor<string> = { token: String, type: "Instance", value: String };
    });

    it("constant value binding descriptor", () => {
      const a: ConstantValueBindingDescriptor<FooService> = { token: FooService, value: new FooService() };
      const b: ConstantValueBindingDescriptor<FooService> = { token: FooService, value: new FooChildService() };

      // @ts-expect-error
      const c: ConstantValueBindingDescriptor<FooService> = { token: FooService, value: new OtherService() };
      // @ts-expect-error
      const d: ConstantValueBindingDescriptor<FooChildService> = { token: FooChildService, value: new FooService() };
      // @ts-expect-error
      const e: ConstantValueBindingDescriptor<FooService> = { token: FooService, value: 3 };
      // @ts-expect-error
      const f: ConstantValueBindingDescriptor<FooService> = { token: 3, value: 3 };
    });

    it("dynamic value binding descriptor", () => {
      const a: DynamicValueBindingDescriptor<FooService> = { token: FooService, factory: () => new FooService() };
      const b: DynamicValueBindingDescriptor<FooService> = { token: FooService, factory: () => new FooChildService() };

      const a2: DynamicValueBindingDescriptor<FooService> = {
        token: FooService,
        // @ts-expect-error
        factory: async () => new FooService(),
      };

      // @ts-expect-error
      const c: DynamicValueBindingDescriptor<FooService> = { token: FooService, factory: () => new OtherService() };
      const d: DynamicValueBindingDescriptor<FooChildService> = {
        token: FooChildService,
        // @ts-expect-error
        factory: () => new FooService(),
      };
      // @ts-expect-error
      const e: DynamicValueBindingDescriptor<FooService> = { token: FooService, factory: () => 3 };
      // @ts-expect-error
      const f: DynamicValueBindingDescriptor<FooService> = { token: 3, factory: () => 3 };
      // @ts-expect-error
      const g: DynamicValueBindingDescriptor<string> = { token: String, factory: () => "foo" };
    });

    it("service redirection binding descriptor", () => {
      const a: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: FooService };
      const b: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: FooChildService };

      const token1 = new InjectionToken<FooService>("token1");
      const token2 = new InjectionToken<FooChildService>("token2");
      const token3 = new InjectionToken<OtherService>("token3");

      const a2: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: token1 };
      const b2: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: token2 };
      const b3: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: "unknown" };

      // @ts-expect-error
      const c: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: OtherService };
      // @ts-expect-error
      const c2: ServiceRedirectionBindingDescriptor<FooService> = { token: FooService, service: token3 };
      // @ts-expect-error
      const d: ServiceRedirectionBindingDescriptor<FooChildService> = { token: FooChildService, service: FooService };
      // @ts-expect-error
      const e: ServiceRedirectionBindingDescriptor<FooService> = { token: 3, service: 3 };
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

      container.bind({ token: FooService, type: "Instance", value: FooChildService });
      container.bind({ token: FooChildService, type: "Instance", value: FooChildService });

      // @ts-expect-error
      container.bind({ token: FooChildService, type: "Instance", value: FooService });

      container.bind({ token: TOKEN1, value: "Foo" });
      container.bind({ token: TOKEN2, value: 42 });

      // @ts-expect-error
      container.bind({ token: TOKEN1, value: 42 });
      // @ts-expect-error
      container.bind({ token: TOKEN2, value: "Foo" });
    });
  });
  it("Injection tokens", () => {
    const SOME_NUMBER = new InjectionToken<number>("SOME_NUMBER");
    const SOME_STRING = new InjectionToken<string>("SOME_STRING");

    const container = new Container();

    container.bind({ token: SOME_NUMBER, value: 3 });
    // @ts-expect-error
    container.bind({ token: SOME_NUMBER, value: "foo" });
    container.bind({ token: SOME_STRING, value: "foo" });
    // @ts-expect-error
    container.bind({ token: SOME_STRING, value: 3 });
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
