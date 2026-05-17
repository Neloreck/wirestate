import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { createElement, ReactNode } from "react";

import { ContainerProvider } from "../provision/container-provider";

/**
 * Wraps a React element tree with {@link ContainerProvider} for testing purposes.
 *
 * @remarks
 * This utility simplifies setting up the IoC context in unit tests. It automatically
 * creates a {@link mockContainer} if none is provided.
 *
 * @group Test-utils
 *
 * @param children - The React tree to be wrapped.
 * @param container - An optional Inversify container. Defaults to a new {@link mockContainer}.
 * @returns A React element wrapped in an {@link ContainerProvider}.
 *
 * @example
 * ```tsx
 * const container: Container = createIocContainer();
 *
 * render(withIocProvider(<MyComponent />, container));
 * ```
 */
export function withContainerProvider(children: ReactNode, container: Container = mockContainer()) {
  return createElement(ContainerProvider, { container }, children);
}
