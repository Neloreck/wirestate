import { type Container, WirestateError } from "@wirestate/core";
import { isHotSwapping } from "@wirestate/core/hot";
import { useContext } from "react";

import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { type Nullable } from "../types/general";

import { ContainerContext } from "./container-context";

/**
 * Returns the active container from the context.
 *
 * @remarks
 * Use this hook when you need direct access to the {@link Container} for manual
 * resolution or checking bindings. For typical usage, prefer {@link useInjection}.
 *
 * @group Container
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

  // Development-only: a render can only land inside the synchronous swap block when something forces rendering from a
  // lifecycle handler (for example `flushSync`). Failing with a clear diagnostic beats a missing-binding error.
  if (process.env.NODE_ENV !== "production" && isHotSwapping()) {
    throw new WirestateError(
      "Rendered during a Wirestate hot swap. A lifecycle handler is forcing synchronous rendering " +
        "(flushSync?), so the previous container is already torn down while the replacement is not " +
        "committed yet.",
      ERROR_CODE_INVALID_CONTEXT
    );
  }

  return value;
}
