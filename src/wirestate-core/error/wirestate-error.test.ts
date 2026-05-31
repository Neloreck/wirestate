import { ERROR_CODE_GENERIC } from "./error-code";
import { WirestateError } from "./wirestate-error";

describe("WirestateError", () => {
  it("should create an error with default code and message", () => {
    const error: WirestateError = new WirestateError("Default message.");

    expect(error.code).toBe(ERROR_CODE_GENERIC);
    expect(error.message).toBe("Default message.");
    expect(error.name).toBe("WirestateError");
  });

  it("should create an error with custom code and message", () => {
    const error: WirestateError = new WirestateError("custom message", "CUSTOM_ERROR");

    expect(error.code).toBe("CUSTOM_ERROR");
    expect(error.message).toBe("custom message");
  });
});
