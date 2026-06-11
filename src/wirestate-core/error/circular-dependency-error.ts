import { ERROR_CODE_CIRCULAR_DEPENDENCY } from "./error-code";
import { WirestateError } from "./wirestate-error";

/**
 * An error thrown when a circular dependency between bindings is detected.
 */
export class CircularDependencyError extends WirestateError {
  /**
   * The name of the error class, useful for identification in minified environments.
   */
  public readonly name: string = "CircularDependencyError";

  /**
   * Creates a circular-dependency error.
   *
   * @param graph - Token names forming the detected dependency cycle.
   */
  public constructor(graph: Array<string>) {
    super(
      `Detected circular dependency: ${graph.join(" -> ")}. Please change your dependency graph or use lazy injection instead.`,
      ERROR_CODE_CIRCULAR_DEPENDENCY
    );
  }
}
