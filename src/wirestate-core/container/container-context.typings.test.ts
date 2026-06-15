/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import type { Optional } from "../types/general";

import { inject } from "./container-context";

describe("inject typings", () => {
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
      private a = inject(FooService, { optional: true }) satisfies Optional<FooService>;
      private b = inject(FooChildService, { optional: true }) satisfies Optional<FooService>;
      // @ts-expect-error
      private c = inject(FooService, { optional: true }) satisfies Optional<FooChildService>;
      // @ts-expect-error
      private d = inject(FooService, { optional: true }) satisfies Promise<Optional<FooService>>;
      // @ts-expect-error
      private e = inject(FooChildService, { optional: true }) satisfies Promise<Optional<FooService>>;
    }
  });
});
