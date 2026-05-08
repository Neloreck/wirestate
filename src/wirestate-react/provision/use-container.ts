import { Container } from "@wirestate/core";

import { useIocContext } from "./use-ioc-context";

/**
 * Returns the active IoC container.
 *
 * @returns active Inversify container
 */
export function useContainer(): Container {
  return useIocContext().container;
}
