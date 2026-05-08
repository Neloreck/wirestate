import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { createElement, ReactNode } from "react";

import { IocProvider } from "../provision/ioc-provider";

/**
 * Wraps a component with IocProvider for testing.
 *
 * @param children - components to wrap
 * @param container - optional custom container
 * @param seed - optional shared seed object
 * @returns wrapped components
 */
export function withIocProvider(
  children: ReactNode,
  container: Container = mockContainer(),
  seed?: Record<string, unknown>
) {
  return createElement(IocProvider, { container, seed }, children);
}
