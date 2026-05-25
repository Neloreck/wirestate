import { Newable } from "../alias";

/**
 * Represents a lookup key for targeted seed values.
 *
 * @remarks
 * Supports class constructors (for targeted seeds), strings, or symbols.
 *
 * @group Seeds
 */
export type SeedKey = Newable | string | symbol;

/**
 * Represents a map of targeted seed values.
 *
 * @remarks
 * Used to store initial state values that are injected into services
 * based on their class constructor or a custom token.
 *
 * @group Seeds
 *
 * @template T - The type of values stored in the map.
 */
export type SeedsMap<T = unknown> = Map<SeedKey, T>;

/**
 * Represents a single targeted seed entry.
 *
 * @remarks
 * Represented as a readonly tuple of `[SeedKey, T]`.
 *
 * @group Seeds
 *
 * @template T - The type of the seed value.
 */
export type SeedEntry<T = unknown> = readonly [SeedKey, T];

/**
 * Represents a collection of targeted seed entries.
 *
 * @remarks
 * Used during container initialization to populate the {@link SeedsMap}.
 *
 * @group Seeds
 */
export type SeedEntries = ReadonlyArray<SeedEntry>;
