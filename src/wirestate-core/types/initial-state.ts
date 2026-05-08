import { Newable } from "inversify";

/**
 * Lookup key for service seeds.
 */
export type TSeedKey = Newable | string | symbol;

/**
 * Key-value map for targeted seeds.
 */
export type TSeedsMap<T = unknown> = Map<TSeedKey, T>;

/**
 * Service-to-seed mapping entry.
 */
export type TSeedEntry<T = unknown> = readonly [TSeedKey, T];

/**
 * Collection of seed entries.
 */
export type TSeedEntries = ReadonlyArray<TSeedEntry>;
