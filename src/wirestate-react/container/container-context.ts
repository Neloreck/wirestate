import { type Container } from "@wirestate/core";
import { type Context, createContext } from "react";

import { type Nullable } from "../types/general";

/**
 * React context carrying the container.
 *
 * @remarks
 * This context is internal to Wirestate. Consumers should use provided hooks
 * like {@link useContainer} or {@link useInjection} to access the container and resolved services.
 *
 * @group Container
 */
export const ContainerContext: Context<Nullable<Container>> = createContext<Nullable<Container>>(null);

ContainerContext.displayName = "ContainerContext";
