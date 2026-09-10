import { Observable } from "../index";

import { hasStoredAnnotations } from "./stored-annotations";

describe("hasStoredAnnotations", () => {
  it("detects annotations recorded by MobX decorators", () => {
    class Annotated {
      @Observable()
      public value: number = 0;
    }

    expect(hasStoredAnnotations(new Annotated())).toBe(true);
  });

  it("detects annotations recorded on a base class", () => {
    class Base {
      @Observable()
      public value: number = 0;
    }

    class Derived extends Base {}

    expect(hasStoredAnnotations(new Derived())).toBe(true);
  });

  it("detects annotations recorded by another MobX copy", () => {
    class Foreign {}

    Object.defineProperty(Foreign.prototype, Symbol("mobx-stored-annotations"), { value: {} });

    expect(hasStoredAnnotations(new Foreign())).toBe(true);
  });

  it("ignores classes without annotations", () => {
    class Plain {
      public value: number = 0;
    }

    class Marked {}

    Object.defineProperty(Marked.prototype, Symbol("unrelated"), { value: {} });

    expect(hasStoredAnnotations(new Plain())).toBe(false);
    expect(hasStoredAnnotations(new Marked())).toBe(false);
    expect(hasStoredAnnotations({})).toBe(false);
  });

  it("stops at a null prototype", () => {
    expect(hasStoredAnnotations(Object.create(Object.create(null)))).toBe(false);
  });
});
