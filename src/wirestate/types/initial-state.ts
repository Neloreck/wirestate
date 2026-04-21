import type { TServiceClass } from "@/wirestate/types/services";

/**
 * Lookup key for service seeds.
 */
export type TInitialStateKey = TServiceClass | string | symbol;

/**
 * Key-value map for targeted initial states.
 */
export type TInitialStatesMap<T = unknown> = Map<TInitialStateKey, T>;

/**
 * Service-to-seed mapping entry.
 */
export type TInitialStateEntry<T = unknown> = readonly [TInitialStateKey, T];

/**
 * Collection of seed entries.
 */
export type TInitialStateEntries = ReadonlyArray<TInitialStateEntry>;
