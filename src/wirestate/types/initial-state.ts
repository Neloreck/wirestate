import type { TServiceClass } from "./services";

/**
 * Lookup key for service seeds.
 */
export type TInitialStateKey = TServiceClass | string | symbol;

/**
 * Service-to-seed mapping entry.
 */
export type TInitialStateEntry<T = unknown> = readonly [TInitialStateKey, T];

/**
 * Collection of seed entries.
 */
export type TInitialStateEntries = ReadonlyArray<TInitialStateEntry>;
