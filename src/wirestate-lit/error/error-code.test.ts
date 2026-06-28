import { ERROR_CODE_INVALID_ARGUMENTS } from "./error-code";

describe("@wirestate/lit error codes", () => {
  // Part of the public contract: consumers branch on `WirestateError.code`. Changing a value is breaking.
  it("should pin the exact public string values", () => {
    expect({
      ERROR_CODE_INVALID_ARGUMENTS,
    }).toEqual({
      ERROR_CODE_INVALID_ARGUMENTS: "LIT_INVALID_ARGUMENTS",
    });
  });

  it("should prefix every Lit error code with the LIT_ origin tag", () => {
    const codes: Array<string> = [ERROR_CODE_INVALID_ARGUMENTS];

    for (const code of codes) {
      expect(code).toMatch(/^LIT_/);
    }
  });
});
