import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { SeedEntries, SeedsMap } from "../types/initial-state";

import { SEEDS_TOKEN } from "./tokens";

/**
 * Adds targeted seed values to a container.
 *
 * @remarks
 * Targeted seeds are keyed by service class, string, or symbol. The existing
 * seed map is updated in place so providers can add and remove their own
 * entries without replacing everyone else's data.
 *
 * @group Seeds
 *
 * @param container - Container to update.
 * @param seeds - Seed entries to add.
 *
 * @example
 * ```typescript
 * import { Injectable, applySeeds, createContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container = createContainer();
 *
 * applySeeds(container, [
 *   [CounterService, { count: 10 }],
 *   ["API_URL", "https://api.example.com"],
 * ]);
 * ```
 */
export function applySeeds(container: Container, seeds: SeedEntries): void {
  const existing: SeedsMap = container.get(SEEDS_TOKEN);

  dbg.info(prefix(__filename), "Applying seeds for container:", { seeds, existing, container });

  for (const [key, state] of seeds) {
    existing.set(key, state);
  }
}
