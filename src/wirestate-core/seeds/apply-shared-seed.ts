import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { AnyObject } from "../types/general";

import { SEED_TOKEN } from "./tokens";

/**
 * Replaces the shared seed object.
 *
 * @remarks
 * A container has one shared seed. Use it for app-wide config: locale,
 * feature flags, API base URL. Targeted seeds live in a separate map.
 *
 * @group Seeds
 *
 * @param container - Container to update.
 * @param seed - New shared seed object.
 *
 * @example
 * ```typescript
 * import { SEED, applySharedSeed, createContainer } from "@wirestate/core";
 *
 * const container = createContainer({ seed: { locale: "en-US" } });
 *
 * applySharedSeed(container, { locale: "uk-UA" });
 *
 * const seed = container.get<{ locale: string }>(SEED);
 * ```
 */
export function applySharedSeed(container: Container, seed: AnyObject): void {
  dbg.info(prefix(__filename), "Apply shared seed:", { shared: seed, container });

  container.rebind<AnyObject>(SEED_TOKEN).toConstantValue(seed);
}
