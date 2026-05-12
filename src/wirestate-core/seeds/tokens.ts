/**
 * Unique symbol used as a token for the container-scoped seeds map.
 *
 * @remarks
 * This token is used to bind and resolve the {@link SeedsMap} in the Inversify {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * const seedsMap: SeedsMap = container.get(SEEDS_TOKEN);
 * ```
 */
export const SEEDS_TOKEN: unique symbol = Symbol("@wirestate/core/seeds");

/**
 * Unique symbol used as a token for the container-scoped shared seed object.
 *
 * @remarks
 * This token is used to bind and resolve the global shared seed object in the Inversify {@link Container}.
 *
 * @group Seeds
 *
 * @example
 * ```typescript
 * const sharedSeed: AnyObject = container.get(SEED_TOKEN);
 * ```
 */
export const SEED_TOKEN: unique symbol = Symbol("@wirestate/core/seed");
