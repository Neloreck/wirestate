import { createContext } from "@lit/context";
import { Container } from "@wirestate/core";

/**
 * Unique symbol used as a key for the IoC context.
 *
 * @group Context
 */
export const IOC_CONTAINER_KEY: unique symbol = Symbol("ContainerContext");

/**
 * Interface for the IoC context value.
 *
 * @group Context
 */
export interface IocContext {
  /**
   * The IoC container instance.
   */
  readonly container: Container;
  /**
   * Revision counter for cache invalidation.
   */
  readonly revision: number;
  /**
   * Function to force a revision update.
   */
  readonly nextRevision: () => number;
}

/**
 * Lit context object for providing and consuming the IoC container.
 *
 * @group Context
 */
export const IocContextObject = createContext<IocContext>(IOC_CONTAINER_KEY);
