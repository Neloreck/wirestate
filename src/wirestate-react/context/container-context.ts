import { type Container } from "@wirestate/core";
import { type Context, createContext } from "react";

import { Optional } from "../types/general";

/**
 * React context carrying the container.
 *
 * @remarks
 * This context is internal to Wirestate. Consumers should use provided hooks
 * like {@link useContainer}, {@link useInjection} or {@link useScope} to access the container and resolved services.
 *
 * @group Context
 */
export const ContainerReactContext: Context<Optional<Container>> = createContext<Optional<Container>>(null);

ContainerReactContext.displayName = "ContainerContext";
