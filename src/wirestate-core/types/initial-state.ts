import { Newable } from "inversify";

/**
 * Lookup key for service seeds.
 */
export type SeedKey = Newable | string | symbol;

/**
 * Key-value map for targeted seeds.
 */
export type SeedsMap<T = unknown> = Map<SeedKey, T>;

/**
 * Service-to-seed mapping entry.
 */
export type SeedEntry<T = unknown> = readonly [SeedKey, T];

/**
 * Collection of seed entries.
 */
export type SeedEntries = ReadonlyArray<SeedEntry>;
