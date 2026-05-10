import { WirestateError } from "@wirestate/core";
import { useContext } from "react";

import { type IocContext, IocReactContext } from "../context/ioc-context";
import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { Optional } from "../types/general";

/**
 * Returns the full IoC context.
 *
 * @group provision
 *
 * @returns active IoC context
 * @internal
 */
export function useIocContext(): IocContext {
  const value: Optional<IocContext> = useContext(IocReactContext);

  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>."
    );
  }

  return value;
}
