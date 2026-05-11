import type { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SEED_TOKEN } from "../registry";
import type { AnyObject } from "../types/general";

/**
 * Rebinds the global shared seed object in the container.
 *
 * @remarks
 * Unlike targeted seeds, there is only one shared seed object per container.
 * This function uses `rebind` to ensure the new shared seed replaces the previous one.
 * The shared seed is typically used for global configuration or common state.
 *
 * @group seeds
 *
 * @param container - The Inversify {@link Container} to update.
 * @param seed - The new shared seed object.
 *
 * @example
 * ```typescript
 * applySharedSeed(container, { theme: "dark", lang: "en" });
 * ```
 */
export function applySharedSeed(container: Container, seed: AnyObject): void {
  dbg.info(prefix(__filename), "Apply shared seed:", { shared: seed, container });

  container.rebind<AnyObject>(SEED_TOKEN).toConstantValue(seed);
}
