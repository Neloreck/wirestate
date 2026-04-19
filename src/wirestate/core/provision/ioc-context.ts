import type { Container } from "inversify";
import { type Context, createContext, type Dispatch, type SetStateAction } from "react";

import type { Optional } from "@/wirestate/types/general";

/**
 * React context value.
 */
export interface IIocContext {
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
export const IocContext: Context<Optional<IIocContext>> = createContext<Optional<IIocContext>>(null);

IocContext.displayName = "IocContext";
