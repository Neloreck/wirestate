/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import type { FactoryBindingDescriptor, InstanceBindingDescriptor, ValueBindingDescriptor } from "../binding/binding";
import { InjectionToken } from "../binding/binding-tokens";
import { inject } from "../container/container-context";
import { ContainerKernel } from "../container/container-kernel";
import { Injectable } from "../metadata/metadata-injectable";
import { Definable } from "../types/general";

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

    it("value binding descriptor", () => {
      const a: ValueBindingDescriptor<FooService> = { token: FooService, value: new FooService() };
      const b: ValueBindingDescriptor<FooService> = { token: FooService, value: new FooChildService() };

      // @ts-expect-error
      const c: ValueBindingDescriptor<FooService> = { token: FooService, value: new OtherService() };
      // @ts-expect-error
      const d: ValueBindingDescriptor<FooChildService> = { token: FooChildService, value: new FooService() };
      // @ts-expect-error
      const e: ValueBindingDescriptor<FooService> = { token: FooService, value: 3 };
      // @ts-expect-error
      const f: ValueBindingDescriptor<FooService> = { token: 3, value: 3 };
    });

    it("factory binding descriptor", () => {
      const a: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new FooService() };
      const b: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new FooChildService() };

      const a2: FactoryBindingDescriptor<FooService> = {
        token: FooService,
        // @ts-expect-error
        factory: async () => new FooService(),
      };

      // @ts-expect-error
      const c: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new OtherService() };
      const d: FactoryBindingDescriptor<FooChildService> = {
        token: FooChildService,
        // @ts-expect-error
        factory: () => new FooService(),
      };
      // @ts-expect-error
      const e: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => 3 };
      // @ts-expect-error
      const f: FactoryBindingDescriptor<FooService> = { token: 3, factory: () => 3 };
      // @ts-expect-error
      const g: FactoryBindingDescriptor<string> = { token: String, factory: () => "foo" };
    });
  });
  describe("Binding", () => {
    @Injectable()
    class FooService {
      private x = Math.random();
    }

    @Injectable()
    class FooChildService extends FooService {
      private y = Math.random();
    }

    const TOKEN1 = new InjectionToken<string>("token1");
    const TOKEN2 = new InjectionToken<number>("token2");

    it("bind()", () => {
      const container = new ContainerKernel();

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

    const container = new ContainerKernel();

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

    it("inject() with optional", () => {
      class Foo {
        private a = inject(FooService, { optional: true }) satisfies Definable<FooService>;
        private b = inject(FooChildService, { optional: true }) satisfies Definable<FooService>;
        // @ts-expect-error
        private c = inject(FooService, { optional: true }) satisfies Definable<FooChildService>;
        // @ts-expect-error
        private d = inject(FooService, { optional: true }) satisfies Promise<Definable<FooService>>;
        // @ts-expect-error
        private e = inject(FooChildService, { optional: true }) satisfies Promise<Definable<FooService>>;
      }
    });
  });
});
