import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SeedEntries, SeedsMap } from "../types/initial-state";

import { SEEDS_TOKEN } from "./tokens";

/**
 * Applies targeted seeds to the container's internal seed map.
 *
 * @remarks
 * This function updates the existing {@link SeedsMap} instance instead of replacing it.
 * This ensures that multiple providers can co-exist and contribute their own seeds
 * without overwriting each other's data.
 *
 * @group Seeds
 *
 * @param container - The Inversify {@link Container} where seeds should be applied.
 * @param seeds - An array of {@link SeedEntries} to add to the container.
 *
 * @example
 * ```typescript
 * applySeeds(container, [
 *   [UserService, { initialUser: "admin" }],
 *   ["API_KEY", "12345"]
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
