import { type Newable, type Optional } from "../types/general";

import { type HotSwapOwner } from "./hot-owner";

/**
 * Anchor key for the process-wide hot-reload state.
 *
 * @internal
 */
const HOT_STATE_KEY: symbol = Symbol.for("wirestate.hot.state");

/**
 * Process-wide hot-reload state shared by every copy of this module.
 *
 * @internal
 */
export interface HotState {
  /** Stable id assigned to each registered class generation. */
  classIds: WeakMap<Newable<object>, string>;
  /** Latest class registered for each stable id. */
  readonly latest: Map<string, Newable<object>>;
  /** Stable ids registered by each module's latest generation. */
  modules: Map<string, Set<string>>;
  /** Stable ids whose class changed since the last swap. */
  readonly dirty: Set<string>;
  /** Live provider registrations able to rebuild their containers. */
  readonly owners: Set<HotSwapOwner>;
  /** Whether a removed class identity requires a full page reload. */
  reloadRequired: boolean;
  /** Whether a swap flush is already scheduled. */
  scheduled: boolean;
  /** Whether a swap is executing right now. */
  swapping: boolean;
}

/**
 * Returns the process-wide hot-reload state, creating it on first access.
 *
 * @internal
 *
 * @returns Shared hot-reload state.
 */
export function getHotState(): HotState {
  const anchor: Record<symbol, HotState> = globalThis as never;
  const state: HotState = (anchor[HOT_STATE_KEY] ??= {
    classIds: new WeakMap(),
    latest: new Map(),
    modules: new Map(),
    dirty: new Set(),
    owners: new Set(),
    reloadRequired: false,
    scheduled: false,
    swapping: false,
  });

  // A hot update can load this version beside an older runtime that already created the
  // process-wide state. Backfill new fields so both copies continue sharing one registry.
  state.classIds ??= new WeakMap();
  state.modules ??= new Map();
  state.reloadRequired ??= false;

  return state;
}

/**
 * Registers injectable classes from an evaluated hot module.
 *
 * @remarks
 * The first registration establishes each class identity. Later registrations with
 * the same names make their replacements available to the next {@link requestHotSwap}.
 * If a registered name disappears, the next request reloads the page because retained
 * configs may still refer to it. Registration does not modify the constructors.
 *
 * @group Hot
 *
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @param classes - Exported classes keyed by their local declaration name.
 */
export function registerHotModule(moduleId: string, classes: Record<string, unknown>): void {
  const state: HotState = getHotState();
  const currentIds: Set<string> = new Set();

  for (const [name, value] of Object.entries(classes)) {
    if (typeof value !== "function") {
      continue;
    }

    const clazz: Newable<object> = value as Newable<object>;
    const id: string = `${moduleId}#${name}`;
    const previous: Optional<Newable<object>> = state.latest.get(id);

    currentIds.add(id);
    state.classIds.set(clazz, id);
    state.latest.set(id, clazz);

    if (previous && previous !== clazz) {
      state.dirty.add(id);
    }
  }

  const previousIds: Optional<Set<string>> = state.modules.get(moduleId);

  if (previousIds) {
    for (const id of previousIds) {
      if (currentIds.has(id)) {
        continue;
      }

      state.latest.delete(id);
      state.dirty.delete(id);
      state.reloadRequired = true;
    }
  }

  state.modules.set(moduleId, currentIds);
}

/**
 * Resolves the newest registered generation of a class.
 *
 * @remarks
 * Values that are not classes, or classes never registered by
 * {@link registerHotModule}, resolve to themselves.
 *
 * @internal
 *
 * @template T - Value type being resolved.
 *
 * @param value - Possibly stale class reference.
 * @returns The newest generation of the class, or the value unchanged.
 */
export function getLatestHotClass<T>(value: T): T {
  if (typeof value !== "function") {
    return value;
  }

  const state: HotState = getHotState();
  const id: Optional<string> = state.classIds.get(value as Newable<object>);

  if (!id) {
    return value;
  }

  return (state.latest.get(id) as Optional<T>) ?? value;
}

/**
 * Returns whether a hot swap is executing right now.
 *
 * @remarks
 * True only inside the synchronous swap block. A React integration uses it to
 * replace a confusing missing-binding error with a clear diagnostic when
 * something forces rendering from inside a lifecycle handler during a swap.
 *
 * @group Hot
 *
 * @returns Whether containers are being swapped at this moment.
 */
export function isHotSwapping(): boolean {
  return getHotState().swapping;
}
