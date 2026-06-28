import { ERROR_CODE_INVALID_CONTEXT, ERROR_CODE_VALIDATION_ERROR } from "./error-code";

describe("@wirestate/react error codes", () => {
  // Part of the public contract: consumers branch on `WirestateError.code`. Changing a value is breaking.
  it("should pin the exact public string values", () => {
    expect({
      ERROR_CODE_INVALID_CONTEXT,
      ERROR_CODE_VALIDATION_ERROR,
    }).toEqual({
      ERROR_CODE_INVALID_CONTEXT: "REACT_INVALID_CONTEXT",
      ERROR_CODE_VALIDATION_ERROR: "REACT_VALIDATION_ERROR",
    });
  });

  it("should prefix every React error code with the REACT_ origin tag", () => {
    const codes: Array<string> = [ERROR_CODE_INVALID_CONTEXT, ERROR_CODE_VALIDATION_ERROR];

    for (const code of codes) {
      expect(code).toMatch(/^REACT_/);
    }
  });
});
