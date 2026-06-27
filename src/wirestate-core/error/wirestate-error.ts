import { ERROR_CODE_GENERIC } from "./error-code";

/**
 * Error type thrown for expected Wirestate API failures.
 *
 * @remarks
 * Use `code` for programmatic checks and `message` for humans. Wirestate uses
 * this for failures a caller can handle, such as invalid config, missing
 * bindings, missing required handlers, and lifecycle access after disposal.
 *
 * @group Error
 *
 * @example
 * ```typescript
 * import { Container, WirestateError } from "@wirestate/core";
 *
 * class MissingService {}
 *
 * const container = new Container();
 *
 * try {
 *   container.get(SomeService);
 * } catch (error) {
 *   if (error instanceof WirestateError) {
 *     console.error(error.code, error.message);
 *   }
 * }
 * ```
 */
export class WirestateError extends Error {
  /**
   * Error class name used for diagnostics.
   */
  public readonly name: string = "WirestateError";

  /**
   * Stable string code identifying the failure type.
   *
   * @remarks
   * Use this when application code needs a specific branch.
   */
  public readonly code: string;

  /**
   * Human-readable diagnostic message.
   */
  public readonly message: string;

  /**
   * Creates a Wirestate error.
   *
   * @param message - Human-readable diagnostic message.
   * @param code - String code for the failure type.
   */
  public constructor(message: string, code: string = ERROR_CODE_GENERIC) {
    super(message);

    this.code = code;
    this.message = message;
  }
}
