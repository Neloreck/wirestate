import { Container } from "inversify";
import { ReactNode } from "react";

import { IocProvider } from "@/wirestate/core/provision/ioc-provider";
import { mockContainer } from "@/wirestate/test-utils/mock-container";

/**
 * Wraps a component with IocProvider for testing.
 *
 * @param children - components to wrap
 * @param container - optional custom container
 * @returns wrapped components
 */
export function withIocProvider(children: ReactNode, container: Container = mockContainer()) {
  return <IocProvider container={container}>{children}</IocProvider>;
}
