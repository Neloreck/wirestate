import { type Identifier, toString } from "../binding/tokens";

import { ERROR_CODE_NO_BINDING_FOUND } from "./error-code";
import { WirestateError } from "./wirestate-error";

/**
 * An error thrown when no binding is registered for the requested token and the request is not optional.
 */
export class NoBindingFoundError extends WirestateError {
  /**
   * The name of the error class, useful for identification in minified environments.
   */
  public readonly name: string = "NoBindingFoundError";

  /**
   * Creates a no-binding-found error.
   *
   * @param token - Token that failed to resolve.
   */
  public constructor(token: Identifier<unknown>) {
    super(`No binding(s) found for ${toString(token)}`, ERROR_CODE_NO_BINDING_FOUND);
  }
}
