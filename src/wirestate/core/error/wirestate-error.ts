import { ERROR_CODE_GENERIC } from "@/wirestate/core/error/error-code";

/**
 * A custom error class that contains generic error information for Wirestate-related issues.
 *
 * This class extends the native `Error` class and is used to represent errors specific
 * to the Wirestate library, providing more structured error handling.
 */
export class WirestateError extends Error {
  /**
   * Name or error class to help differentiate error class in minified environments.
   */
  public readonly name: string = "WirestateError";
  /**
   * Error code describing the issue.
   */
  public readonly code: number;
  /**
   * Error message describing the issue.
   */
  public readonly message: string;

  public constructor(code: number = ERROR_CODE_GENERIC, detail?: string) {
    super();

    this.code = code;
    this.message = detail || "Wirestate error.";
  }
}
