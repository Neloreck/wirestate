import { Container } from "@wirestate/core";

import { useIocContext } from "./use-ioc-context";

/**
 * Returns the active Inversify container from the IoC context.
 *
 * @remarks
 * Use this hook when you need direct access to the {@link Container} for manual
 * resolution or checking bindings. For typical service usage, prefer
 * {@link useInjection}.
 *
 * @group Provision
 *
 * @returns The active Inversify container.
 *
 * @example
 * ```tsx
 * const container: Container = useContainer();
 * const isBound: boolean = container.isBound(MyToken);
 * ```
 */
export function useContainer(): Container {
  return useIocContext().container;
}
