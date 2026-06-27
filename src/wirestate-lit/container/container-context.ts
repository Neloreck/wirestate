import { type Context, createContext } from "@lit/context";
import { type Container } from "@wirestate/core";

/**
 * Unique symbol used as a key for the IoC context.
 *
 * @group Container
 */
export const CONTAINER_KEY: unique symbol = Symbol("ContainerContext");

/**
 * Lit context object for providing and consuming the container.
 *
 * @group Container
 */
export const ContainerContext: Context<unknown, Container> = createContext<Container>(CONTAINER_KEY);
