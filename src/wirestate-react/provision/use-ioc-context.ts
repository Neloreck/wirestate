import { WirestateError } from "@wirestate/core";
import { useContext } from "react";

import { type IocContext, IocReactContext } from "../context/ioc-context";
import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";

/**
 * Returns the full IoC context.
 *
 * @returns active IoC context
 * @internal
 */
export function useIocContext(): IocContext {
  const value = useContext(IocReactContext);

  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>."
    );
  }

  return value;
}
