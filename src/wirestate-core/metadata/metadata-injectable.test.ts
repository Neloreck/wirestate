import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";

import { Injectable, isInjectable } from "./metadata-injectable";

describe("Injectable", () => {
  it("should mark decorated classes as injectable", () => {
    @Injectable()
    class DecoratedService {}

    class PlainService {}

    expect(isInjectable(DecoratedService)).toBe(true);
    expect(isInjectable(PlainService)).toBe(false);
  });

  it("should register classes through direct legacy invocation", () => {
    class LateService {}

    expect(isInjectable(LateService)).toBe(false);

    Injectable()(LateService);

    expect(isInjectable(LateService)).toBe(true);
  });

  it("should register classes through a standard decorator context", () => {
    class StandardService {}

    const context = {
      kind: "class",
      name: "StandardService",
      addInitializer: () => {},
      metadata: {},
    } as unknown as ClassDecoratorContext;

    Injectable()(StandardService, context);

    expect(isInjectable(StandardService)).toBe(true);
  });

  it("should reject standard decorator contexts of other kinds", () => {
    class MisappliedService {}

    const context = { kind: "method", name: "method" } as unknown as ClassDecoratorContext;

    expect(() => Injectable()(MisappliedService, context)).toThrow(
      expect.objectContaining({
        message: "@Injectable() can only decorate classes.",
        code: ERROR_CODE_INVALID_ARGUMENTS,
      })
    );
    expect(isInjectable(MisappliedService)).toBe(false);
  });

  it("should treat repeated decoration as idempotent", () => {
    class TwiceService {}

    Injectable()(TwiceService);
    Injectable()(TwiceService);

    expect(isInjectable(TwiceService)).toBe(true);
  });

  it("should not mark subclasses of injectable classes", () => {
    @Injectable()
    class BaseService {}

    class DerivedService extends BaseService {}

    expect(isInjectable(BaseService)).toBe(true);
    expect(isInjectable(DerivedService)).toBe(false);
  });
});
