import { Container, WirestateError } from "@wirestate/core";
import { useContext } from "react";

import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { Optional } from "../types/general";

import { ContainerReactContext } from "./container-context";

/**
 * Returns the active container from the context.
 *
 * @remarks
 * Use this hook when you need direct access to the {@link Container} for manual
 * resolution or checking bindings. For typical service usage, prefer
 * {@link useInjection}.
 *
 * @group Context
 *
 * @returns The active container.
 *
 * @example
 * ```tsx
 * const container: Container = useContainer();
 * const isBound: boolean = container.isBound(MyToken);
 * ```
 */
export function useContainer(): Container {
  const value: Optional<Container> = useContext(ContainerReactContext);

  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access container context from React subtree not wrapped in <ContainerProvider>."
    );
  }

  return value;
}
