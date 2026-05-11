import { Newable } from "inversify";

/**
 * Represents a lookup key for service seeds.
 *
 * @remarks
 * Supports class constructors (for targeted seeds), strings, or symbols.
 *
 * @group seeds
 */
export type SeedKey = Newable | string | symbol;

/**
 * Represents a key-value map for targeted seeds.
 *
 * @remarks
 * Used to store initial state values that are injected into services
 * based on their class constructor or a custom token.
 *
 * @group seeds
 *
 * @template T - The type of values stored in the map.
 */
export type SeedsMap<T = unknown> = Map<SeedKey, T>;

/**
 * Represents a single service-to-seed mapping entry.
 *
 * @remarks
 * Represented as a readonly tuple of `[SeedKey, T]`.
 *
 * @group seeds
 *
 * @template T - The type of the seed value.
 */
export type SeedEntry<T = unknown> = readonly [SeedKey, T];

/**
 * Represents a collection of seed entries.
 *
 * @remarks
 * Used during container initialization to populate the {@link SeedsMap}.
 *
 * @group seeds
 */
export type SeedEntries = ReadonlyArray<SeedEntry>;
