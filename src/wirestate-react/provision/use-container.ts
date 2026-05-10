import { Container } from "@wirestate/core";

import { useIocContext } from "./use-ioc-context";

/**
 * Returns the active IoC container.
 *
 * @group provision
 *
 * @returns Active Inversify container.
 */
export function useContainer(): Container {
  return useIocContext().container;
}
