import { ERROR_CODE_GENERIC } from "./error-code";

/**
 * Error type thrown by Wirestate APIs.
 *
 * @remarks
 * Use `code` for programmatic checks and `message` for humans. Wirestate uses
 * this for expected library failures: invalid config, missing handlers, and
 * lifecycle access after disposal.
 *
 * @group Error
 *
 * @example
 * ```typescript
 * import { WirestateError } from "@wirestate/core";
 *
 * try {
 *   scope.resolve(SomeService);
 * } catch (error) {
 *   if (error instanceof WirestateError) {
 *     console.error(error.code, error.message);
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
   * Creates a Wirestate error.
   *
   * @param code - Numeric error code.
   * @param detail - Error message.
   */
  public constructor(code: number = ERROR_CODE_GENERIC, detail?: string) {
    super();

    this.code = code;
    this.message = detail || "Wirestate error.";
  }
}
