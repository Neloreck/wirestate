import { Newable } from "inversify";

/**
 * Lookup key for service seeds.
 *
 * @group seeds
 */
export type SeedKey = Newable | string | symbol;

/**
 * Key-value map for targeted seeds.
 *
 * @group seeds
 */
export type SeedsMap<T = unknown> = Map<SeedKey, T>;

/**
 * Service-to-seed mapping entry.
 *
 * @group seeds
 */
export type SeedEntry<T = unknown> = readonly [SeedKey, T];

/**
 * Collection of seed entries.
 *
 * @group seeds
 */
export type SeedEntries = ReadonlyArray<SeedEntry>;
