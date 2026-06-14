import { Container } from "@wirestate/core";
import { Context, createContext } from "react";

import { Nullable } from "../types/general";

/**
 * React context carrying the container.
 *
 * @remarks
 * This context is internal to Wirestate. Consumers should use provided hooks
 * like {@link useContainer} or {@link useInjection} to access the container and resolved services.
 *
 * @group Context
 */
export const ContainerContext: Context<Nullable<Container>> = createContext<Nullable<Container>>(null);

ContainerContext.displayName = "ContainerContext";
