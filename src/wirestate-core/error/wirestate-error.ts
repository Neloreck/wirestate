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
 * import { Container, WirestateError } from "@wirestate/core";
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
   * The name of the error class, useful for identification in minified environments.
   */
  public readonly name: string = "WirestateError";

  /**
   * String error code identifying the specific failure type.
   */
  public readonly code: string;

  /**
   * Human-readable description of the error.
   */
  public readonly message: string;

  /**
   * Creates a Wirestate error.
   *
   * @param message - Error message.
   * @param code - String error code.
   */
  public constructor(message: string, code: string = ERROR_CODE_GENERIC) {
    super(message);

    this.code = code;
    this.message = message;
  }
}
