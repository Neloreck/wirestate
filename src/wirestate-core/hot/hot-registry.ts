import { type Newable, type Optional } from "../types/general";

import { type HotSwapOwner } from "./hot-owner";

/**
 * Anchor key for the process-wide hot-reload state.
 *
 * @internal
 */
const HOT_STATE_KEY: symbol = Symbol.for("wirestate.hot.state");

/**
 * A hot module whose body is evaluating right now, collecting the classes it declares.
 *
 * @internal
 */
export interface HotModuleFrame {
  /** Stable module identifier passed to {@link openHotModule}. */
  readonly moduleId: string;
  /** Classes decorated while the module was open, keyed by their registration name. */
  readonly classes: Map<string, Newable<object>>;
}

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
  /** Modules currently evaluating, innermost last. */
  open: Array<HotModuleFrame>;
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
 * Returns the process-wide hot-reload state when something already created it.
 *
 * @internal
 *
 * @returns Shared hot-reload state, or `undefined` before the first {@link getHotState} call.
 */
export function peekHotState(): Optional<HotState> {
  return (globalThis as Record<symbol, Optional<HotState>>)[HOT_STATE_KEY];
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
    open: [],
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
  state.open ??= [];
  state.reloadRequired ??= false;

  return state;
}

/**
 * Marks the start of a hot module's evaluation.
 *
 * @group Hot
 *
 * @param moduleId - Stable module identifier, usually the root-relative path.
 */
export function openHotModule(moduleId: string): void {
  getHotState().open.push({ moduleId, classes: new Map() });
}

/**
 * Attributes a decorated class to the hot module currently evaluating.
 *
 * Classes register under their name. A second class with the same name in one module
 * gets an ordinal suffix, so reordering same-named classes reads as a rename.
 *
 * @internal
 *
 * @param clazz - Class decorated during module evaluation.
 */
export function registerHotClass(clazz: Newable<object>): void {
  const frame: Optional<HotModuleFrame> = peekHotState()?.open?.at(-1);

  if (!frame) {
    return;
  }

  const classes: Map<string, Newable<object>> = frame.classes;
  const name: string = clazz.name || "default";

  let key: string = name;

  for (let ordinal: number = 2; classes.has(key); ordinal++) {
    key = `${name}#${ordinal}`;
  }

  classes.set(key, clazz);
}

/**
 * Marks the end of a hot module's evaluation and registers the classes it declared.
 *
 * @remarks
 * Injected by the dev bundler plugin as the last statement of a module. Registration
 * follows {@link registerHotModule}, so a replaced class becomes available to the next
 * {@link requestHotSwap} and a disappeared class requests a page reload.
 *
 * @group Hot
 *
 * @returns Whether the module declares, or previously declared, hot-swappable classes.
 * The plugin footer accepts the module's own hot updates only in that case.
 */
export function closeHotModule(): boolean {
  const state: HotState = getHotState();
  const frame: Optional<HotModuleFrame> = state.open.pop();

  if (!frame) {
    return false;
  }

  const participated: boolean = (state.modules.get(frame.moduleId)?.size ?? 0) > 0;

  registerHotModule(frame.moduleId, Object.fromEntries(frame.classes));

  return participated || frame.classes.size > 0;
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
 * This is the explicit form. Transformed modules register through {@link openHotModule}
 * and {@link closeHotModule} instead, letting `@Injectable()` collect the classes.
 *
 * @group Hot
 *
 * @param moduleId - Stable module identifier, usually the root-relative path.
 * @param classes - Classes keyed by their registration name.
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
