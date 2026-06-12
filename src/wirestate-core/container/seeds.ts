/**
 * Unique symbol used as a token for the container-scoped seeds map.
 *
 * @remarks
 * This token is used to bind and resolve the {@link SeedsMap} in the {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * import { SEEDS, type SeedsMap } from "@wirestate/core";
 *
 * const seedsMap: SeedsMap = container.get(SEEDS);
 * ```
 */
export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/core/seeds");

/**
 * Unique symbol used as a token for the container-scoped shared seed object.
 *
 * @remarks
 * This token is used to bind and resolve the shared seed object in the {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * import { SEED } from "@wirestate/core";
 *
 * const sharedSeed: Record<string, unknown> = container.get(SEED);
 * ```
 */
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/core/seed");
