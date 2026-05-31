import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { SeedBindings, SeedsMap } from "../types/seeds";

import { SEEDS_TOKEN } from "./tokens";

/**
 * Removes targeted seed values from a container.
 *
 * @remarks
 * This removes by key. The seed values in `seeds` are ignored.
 *
 * @group Seeds
 *
 * @param container - Container to update.
 * @param seeds - Seed bindings whose keys should be removed.
 *
 * @example
 * ```typescript
 * import { Injectable, createContainer, unsetSeeds } from "@wirestate/core";
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container = createContainer({
 *   seeds: [[CounterService, { count: 10 }]],
 * });
 *
 * unsetSeeds(container, [[CounterService, { count: 10 }]]);
 * ```
 */
export function unsetSeeds(container: Container, seeds: SeedBindings): void {
  const existing: SeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Unapply seeds for container:", { existing, seeds, container });

  for (const [key] of seeds) {
    existing.delete(key);
  }
}
