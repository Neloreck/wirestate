import { ERROR_CODE_INVALID_ARGUMENTS, ERROR_CODE_INVALID_CONTEXT } from "./error-code";

describe("@wirestate/react error codes", () => {
  // Part of the public contract: consumers branch on `WirestateError.code`. Changing a value is breaking.
  it("should pin the exact public string values", () => {
    expect({
      ERROR_CODE_INVALID_CONTEXT,
      ERROR_CODE_INVALID_ARGUMENTS,
    }).toEqual({
      ERROR_CODE_INVALID_CONTEXT: "REACT_INVALID_CONTEXT",
      ERROR_CODE_INVALID_ARGUMENTS: "REACT_INVALID_ARGUMENTS",
    });
  });

  it("should prefix every React error code with the REACT_ origin tag", () => {
    const codes: Array<string> = [ERROR_CODE_INVALID_CONTEXT, ERROR_CODE_INVALID_ARGUMENTS];

    for (const code of codes) {
      expect(code).toMatch(/^REACT_/);
    }
  });
});
