import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { createElement, ReactNode } from "react";

import { IocProvider } from "../provision/ioc-provider";

/**
 * Wraps a React element tree with {@link IocProvider} for testing purposes.
 *
 * @remarks
 * This utility simplifies setting up the IoC context in unit tests. It automatically
 * creates a {@link mockContainer} if none is provided.
 *
 * @group Test-utils
 *
 * @param children - The React tree to be wrapped.
 * @param container - An optional Inversify container. Defaults to a new {@link mockContainer}.
 * @param seed - Optional shared seed data to be applied to the container.
 * @returns A React element wrapped in an {@link IocProvider}.
 *
 * @example
 * ```tsx
 * const container: Container = createIocContainer();
 *
 * render(withIocProvider(<MyComponent />, container));
 * ```
 */
export function withIocProvider(
  children: ReactNode,
  container: Container = mockContainer(),
  seed?: Record<string, unknown>
) {
  return createElement(IocProvider, { container, seed }, children);
}
