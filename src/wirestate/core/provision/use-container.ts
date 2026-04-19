import { Container } from "inversify";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";

/**
 * Returns the active IoC container.
 *
 * @returns active Inversify container
 */
export function useContainer(): Container {
  return useIocContext().container;
}
