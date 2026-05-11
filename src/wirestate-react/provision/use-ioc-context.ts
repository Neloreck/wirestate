import { WirestateError } from "@wirestate/core";
import { useContext } from "react";

import { type IocContext, IocReactContext } from "../context/ioc-context";
import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";
import { Optional } from "../types/general";

/**
 * Accesses the raw {@link IocContext} from React context.
 *
 * @remarks
 * This is an internal utility hook used by other hooks in the library.
 * It throws an error if called outside of an {@link IocProvider}.
 *
 * @group Provision
 * @internal
 *
 * @returns The active {@link IocContext}.
 *
 * @throws {WirestateError} If used outside of an {@link IocProvider}.
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
