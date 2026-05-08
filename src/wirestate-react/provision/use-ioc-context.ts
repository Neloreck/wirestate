import { useContext } from "react";

import { ERROR_CODE_INVALID_CONTEXT } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { type IIocContext, IocContext } from "@/wirestate-react/provision/ioc-context";
import type { Optional } from "@/wirestate/types/general";

/**
 * Returns the full IoC context.
 *
 * @returns active IoC context
 * @internal
 */
export function useIocContext(): IIocContext {
  const value: Optional<IIocContext> = useContext(IocContext);

  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>."
    );
  }

  return value;
}
