import { Container } from "inversify";
import { createElement, ReactNode } from "react";

import { IocProvider } from "@/wirestate-react/provision/ioc-provider";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { TAnyObject } from "@/wirestate/types/general";

/**
 * Wraps a component with IocProvider for testing.
 *
 * @param children - components to wrap
 * @param container - optional custom container
 * @param seed - optional shared seed object
 * @returns wrapped components
 */
export function withIocProvider(children: ReactNode, container: Container = mockContainer(), seed?: TAnyObject) {
  return createElement(IocProvider, { container, seed }, children);
}
