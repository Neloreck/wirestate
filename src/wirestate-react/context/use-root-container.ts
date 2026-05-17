import { Container } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

/**
 * Creates and memoizes a root container for a component.
 *
 * @remarks
 * The `factory` function re-runs only when one of `deps` changes.
 * Between such changes, the same container instance is returned.
 *
 * @group Context
 *
 * @param factory - Lazily creates the root container.
 * @param deps - Dependency list controlling when container is recreated.
 * @returns The memoized root container instance.
 *
 * @example
 * ```tsx
 * const container: Container = useRootContainer(
 *   () =>
 *     createIocContainer({
 *       entries: [CounterService, LoggerService],
 *     }),
 *   []
 * );
 * ```
 */
export function useRootContainer(factory: () => Container, deps: Array<unknown>) {
  return useMemo(() => {
    const container: Container = factory();

    dbg.info(prefix(__filename), "Created root container:", { container, factory, deps });

    return container;
  }, deps);
}
