import { useContext } from "react";

import { WirestateError } from "@/wirestate";
import { ERROR_CODE_INVALID_CONTEXT } from "@/wirestate-react/error/error-code";
import { type IIocContext, IocContext } from "@/wirestate-react/provision/ioc-context";

/**
 * Returns the full IoC context.
 *
 * @returns active IoC context
 * @internal
 */
export function useIocContext(): IIocContext {
  const value = useContext(IocContext);

  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>."
    );
  }

  return value;
}
