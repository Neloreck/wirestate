import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { validateStandardMethodContext } from "./metadata-decorator-context";

function mockContext(overrides: object = {}): ClassMethodDecoratorContext {
  return {
    kind: "method",
    name: "onEvent",
    static: false,
    private: false,
    addInitializer: () => {},
    metadata: {},
    ...overrides,
  } as unknown as ClassMethodDecoratorContext;
}

describe("validateStandardMethodContext", () => {
  it("should return the metadata object for a public instance method context", () => {
    const metadata: DecoratorMetadataObject = {};

    expect(validateStandardMethodContext("OnEvent", mockContext({ metadata }))).toBe(metadata);
  });

  it.each(["accessor", "field", "getter", "setter", "class"])("should reject '%s' contexts", (kind) => {
    expect(() => validateStandardMethodContext("OnEvent", mockContext({ kind }))).toThrow(
      expect.objectContaining({
        message: "@OnEvent() can only decorate class methods.",
        code: ERROR_CODE_VALIDATION_ERROR,
      })
    );
  });

  it("should reject static method contexts", () => {
    expect(() => validateStandardMethodContext("OnEvent", mockContext({ static: true }))).toThrow(
      expect.objectContaining({
        message: "@OnEvent() cannot decorate static methods.",
        code: ERROR_CODE_VALIDATION_ERROR,
      })
    );
  });

  it("should reject private method contexts", () => {
    expect(() => validateStandardMethodContext("OnEvent", mockContext({ private: true }))).toThrow(
      expect.objectContaining({
        message: "@OnEvent() cannot decorate private methods.",
        code: ERROR_CODE_VALIDATION_ERROR,
      })
    );
  });

  it("should reject contexts without decorator metadata", () => {
    expect(() => validateStandardMethodContext("OnEvent", mockContext({ metadata: undefined }))).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          "@OnEvent() requires decorator metadata support, but 'Symbol.metadata' is undefined."
        ),
        code: ERROR_CODE_VALIDATION_ERROR,
      })
    );
  });

  it("should throw WirestateError instances", () => {
    expect(() => validateStandardMethodContext("OnEvent", mockContext({ kind: "class" }))).toThrow(WirestateError);
  });

  it("should use the supplied decorator name in diagnostics", () => {
    expect(() => validateStandardMethodContext("OnQuery", mockContext({ static: true }))).toThrow(
      "@OnQuery() cannot decorate static methods."
    );
  });
});
