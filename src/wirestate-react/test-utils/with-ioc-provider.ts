import { Container } from "inversify";
import { createElement, ReactNode } from "react";

import { mockContainer } from "@/wirestate/test-utils";
import { IocProvider } from "@/wirestate-react/provision/ioc-provider";

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
