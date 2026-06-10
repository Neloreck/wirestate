import { type Token, toString } from "./tokens";

/**
 * An error thrown when no provider is bound for the requested token and the request is not optional.
 */
export class NoProviderFoundError extends Error {
  public constructor(token: Token<unknown>) {
    super(`No provider(s) found for ${toString(token)}`);
  }
}

/**
 * An error thrown when a circular dependency between providers is detected.
 */
export class CircularDependencyError extends Error {
  public constructor(graph: Array<string>) {
    super(
      `Detected circular dependency: ${graph.join(" -> ")}. Please change your dependency graph or use lazy injection instead.`
    );
  }
}
