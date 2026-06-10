import { type Identifier, toString } from "./tokens";

/**
 * An error thrown when no binding is registered for the requested token and the request is not optional.
 */
export class NoBindingFoundError extends Error {
  public constructor(token: Identifier<unknown>) {
    super(`No binding(s) found for ${toString(token)}`);
  }
}

/**
 * An error thrown when a circular dependency between bindings is detected.
 */
export class CircularDependencyError extends Error {
  public constructor(graph: Array<string>) {
    super(
      `Detected circular dependency: ${graph.join(" -> ")}. Please change your dependency graph or use lazy injection instead.`
    );
  }
}
