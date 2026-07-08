import { type Container } from "@wirestate/core";
import { type Context, createContext } from "react";

import { type Nullable } from "../types/general";

/**
 * React context carrying the container.
 *
 * @remarks
 * Exported for advanced integrations such as custom providers, SSR, and testing.
 * Prefer the {@link useContainer} / {@link useInjection} hooks for everyday access to the container and resolved services.
 *
 * @group Container
 */
export const ContainerContext: Context<Nullable<Container>> = createContext<Nullable<Container>>(null);

ContainerContext.displayName = "ContainerContext";
