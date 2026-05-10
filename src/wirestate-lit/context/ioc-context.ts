import { createContext } from "@lit/context";
import { Container } from "@wirestate/core";

/**
 * @group context
 */
export const IOC_CONTAINER_KEY: unique symbol = Symbol("ContainerContext");

/**
 * @group context
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
  readonly nextRevision: () => number;
}

export const ContainerContext = createContext<IocContext>(IOC_CONTAINER_KEY);
