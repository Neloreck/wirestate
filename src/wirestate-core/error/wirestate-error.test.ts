import { ERROR_CODE_GENERIC } from "@/wirestate-core/error/error-code";
import { WirestateError } from "@/wirestate-core/error/wirestate-error";

describe("WirestateError", () => {
  it("should create an error with default code and message", () => {
    const error: WirestateError = new WirestateError();

    expect(error.code).toBe(ERROR_CODE_GENERIC);
    expect(error.message).toBe("Wirestate error.");
    expect(error.name).toBe("WirestateError");
  });

  it("should create an error with custom code and message", () => {
    const error: WirestateError = new WirestateError(123, "custom message");

    expect(error.code).toBe(123);
    expect(error.message).toBe("custom message");
  });
});
