import { Container, createContainer } from "@wirestate/core";
import { createElement, ReactNode } from "react";

import { ContainerProvider } from "../provision/container-provider";

/**
 * Wraps a React element tree with {@link ContainerProvider} for testing purposes.
 *
 * @remarks
 * This utility simplifies setting up the IoC context in unit tests. It automatically
 * creates a {@link createContainer} if none is provided.
 *
 * @group Test-utils
 *
 * @param children - The React tree to be wrapped.
 * @param container - An optional Inversify container. Defaults to a new {@link createContainer}.
 * @returns A React element wrapped in an {@link ContainerProvider}.
 *
 * @example
 * ```tsx
 * const container: Container = createContainer();
 *
 * render(withContainerProvider(<MyComponent />, container));
 * ```
 */
export function withContainerProvider(children: ReactNode, container: Container = createContainer()) {
  return createElement(ContainerProvider, { container }, children);
}
