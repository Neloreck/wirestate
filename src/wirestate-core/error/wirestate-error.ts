import { ERROR_CODE_GENERIC } from "./error-code";

/**
 * Base error class for all Wirestate-related exceptions.
 *
 * @remarks
 * `WirestateError` provides structured error information, including a numeric error code
 * and a descriptive message. It is used throughout the library to signal lifecycle
 * violations, messaging failures, and configuration issues.
 *
 * @group error
 *
 * @example
 * ```typescript
 * try {
 *   scope.getContainer();
 * } catch (error) {
 *   if (error instanceof WirestateError) {
 *     console.error(`Error code: ${error.code}`);
 *   }
 * }
 * ```
 */
export class WirestateError extends Error {
  /**
   * The name of the error class, useful for identification in minified environments.
   */
  public readonly name: string = "WirestateError";
  /**
   * Numeric error code identifying the specific failure type.
   */
  public readonly code: number;
  /**
   * Human-readable description of the error.
   */
  public readonly message: string;

  /**
   * Creates a new instance of WirestateError.
   *
   * @param code - Numeric identifier for the error (defaults to ERROR_CODE_GENERIC).
   * @param detail - Optional descriptive message.
   */
  public constructor(code: number = ERROR_CODE_GENERIC, detail?: string) {
    super();

    this.code = code;
    this.message = detail || "Wirestate error.";
  }
}
