import { type Container } from "@wirestate/core";
import { type Context, createContext, type Dispatch, type SetStateAction } from "react";

import { Optional } from "@/wirestate-react/types/general";

/**
 * React context value.
 */
export interface IocContext {
  /**
   * Inversify container.
   */
  readonly container: Container;
  /**
   * Revision counter for cache invalidation.
   */
  readonly revision: number;
  /**
   * Forces a revision update.
   */
  readonly setRevision: Dispatch<SetStateAction<number>>;
}

/**
 * React context carrying the IoC container.
 * Internal. Use hooks to access services.
 */
export const IocReactContext: Context<Optional<IocContext>> = createContext<Optional<IocContext>>(null);

IocReactContext.displayName = "IocContext";
