import { createContext } from "@lit/context";
import { Container } from "@wirestate/core";

/**
 * Context key for the IoC container.
 *
 * @group context
 */
export const IOC_CONTAINER_KEY: unique symbol = Symbol("ContainerContext");

/**
 * Interface for the IoC context value.
 *
 * @group context
 */
export interface IocContext {
  /**
   * The Inversify IoC container.
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
 * Lit context for providing and consuming the IoC container.
 *
 * @group context
 */
export const ContainerContext = createContext<IocContext>(IOC_CONTAINER_KEY);
