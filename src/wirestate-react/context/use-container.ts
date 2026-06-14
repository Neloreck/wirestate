import { Container, WirestateError } from "@wirestate/core";
import { useContext } from "react";

import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { Nullable } from "../types/general";

import { ContainerContext } from "./container-context";

/**
 * Returns the active container from the context.
 *
 * @remarks
 * Use this hook when you need direct access to the {@link Container} for manual
 * resolution or checking bindings. For typical usage, prefer {@link useInjection}.
 *
 * @group Context
 *
 * @returns The active container.
 *
 * @example
 * ```tsx
 * const container: Container = useContainer();
 * const isBound: boolean = container.has(MyToken);
 * ```
 */
export function useContainer(): Container {
  const value: Nullable<Container> = useContext(ContainerContext);

  if (!value) {
    throw new WirestateError(
      "Trying to access container context from React subtree not wrapped in <ContainerProvider>.",
      ERROR_CODE_INVALID_CONTEXT
    );
  }

  return value;
}
