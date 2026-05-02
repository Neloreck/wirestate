import { getQueryHandlerMetadata } from "@/wirestate/core/queries/get-query-handler-metadata";
import { OnQuery } from "@/wirestate/core/queries/on-query";

describe("OnQuery and getQueryHandlerMetadata", () => {
  it("should collect metadata for a single class", () => {
    class TestService {
      @OnQuery("QUERY_FIRST")
      public onFirst(): void {}

      @OnQuery("QUERY_SECOND")
      public onSecond(): void {}
    }

    expect(getQueryHandlerMetadata(new TestService())).toEqual(
      expect.arrayContaining([
        { type: "QUERY_FIRST", methodName: "onFirst" },
        { type: "QUERY_SECOND", methodName: "onSecond" },
      ])
    );
  });

  it("should collect metadata across class hierarchy (parent first)", () => {
    class BaseService {
      @OnQuery("BASE_QUERY")
      public onBase(): void {}
    }

    class DerivedService extends BaseService {
      @OnQuery("DERIVED_QUERY")
      public onDerived(): void {}
    }

    expect(getQueryHandlerMetadata(new DerivedService())).toEqual([
      { type: "BASE_QUERY", methodName: "onBase" },
      { type: "DERIVED_QUERY", methodName: "onDerived" },
    ]);
  });

  it("should handle classes without queries", () => {
    class NoQueryService {}

    expect(getQueryHandlerMetadata(new NoQueryService())).toEqual([]);
  });

  it("should handle classes generic objects", () => {
    expect(getQueryHandlerMetadata({})).toEqual([]);
    expect(getQueryHandlerMetadata(Object)).toEqual([]);
    expect(getQueryHandlerMetadata(Object.prototype)).toEqual([]);
  });

  it("should handle deep hierarchy", () => {
    class A {
      @OnQuery("A")
      public a(): void {}
    }

    class B extends A {
      @OnQuery("B")
      public b(): void {}
    }

    class C extends B {
      @OnQuery("C")
      public c(): void {}
    }

    expect(getQueryHandlerMetadata(new C()).map((it) => it.type)).toEqual(["A", "B", "C"]);
  });

  it("should support symbol query types", () => {
    const TYPE: unique symbol = Symbol("symbol-query");

    class SymbolService {
      @OnQuery(TYPE)
      public onSymbol(): void {}
    }

    expect(getQueryHandlerMetadata(new SymbolService())).toEqual([{ type: TYPE, methodName: "onSymbol" }]);
  });
});
