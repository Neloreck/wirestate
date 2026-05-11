import { type Container } from "@wirestate/core";
import { type Context, createContext, type Dispatch, type SetStateAction } from "react";

import { Optional } from "../types/general";

/**
 * Value provided by the IoC React context.
 *
 * @remarks
 * Contains the Inversify container and a revision counter used to trigger
 * re-renders in components when the container bindings change.
 *
 * @group context
 */
export interface IocContext {
  /**
   * The Inversify container instance used for dependency resolution.
   */
  readonly container: Container;
  /**
   * Revision counter for cache invalidation and re-rendering.
   */
  readonly revision: number;
  /**
   * State setter for the revision counter.
   */
  readonly setRevision: Dispatch<SetStateAction<number>>;
}

/**
 * React context carrying the {@link IocContext}.
 *
 * @remarks
 * This context is internal to Wirestate. Consumers should use provided hooks
 * like {@link useContainer}, {@link useInjection} or {@link useScope} to access the container and resolved services.
 *
 * @group context
 */
export const IocReactContext: Context<Optional<IocContext>> = createContext<Optional<IocContext>>(null);

IocReactContext.displayName = "IocContext";
