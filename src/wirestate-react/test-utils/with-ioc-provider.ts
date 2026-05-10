import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { createElement, ReactNode } from "react";

import { IocProvider } from "../provision/ioc-provider";

/**
 * Wraps a component with IocProvider for testing.
 *
 * @group provision
 *
 * @param children - Components to wrap.
 * @param container - Optional custom container.
 * @param seed - Optional shared seed object.
 * @returns Wrapped components.
 */
export function withIocProvider(
  children: ReactNode,
  container: Container = mockContainer(),
  seed?: Record<string, unknown>
) {
  return createElement(IocProvider, { container, seed }, children);
}
