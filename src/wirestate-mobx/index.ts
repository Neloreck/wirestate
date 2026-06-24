/**
 * Framework-agnostic MobX re-exports with Wirestate-friendly decorator aliases.
 *
 * Shared by `@wirestate/react-mobx` and `@wirestate/lit-mobx` so that observable
 * services can be defined once and consumed from either React or Lit applications.
 *
 * @packageDocumentation
 */

import {
  type IActionFactory,
  type IComputedFactory,
  type IObservableFactory,
  action,
  computed,
  observable,
} from "mobx";

/**
 * @group MobX
 * @see {@link https://mobx.js.org/README.html}
 */
export {
  type AnnotationMapEntry,
  type AnnotationsMap,
  type CreateObservableOptions,
  type IActionFactory,
  type IActionRunInfo,
  type IArrayDidChange,
  type IArraySplice,
  type IArrayUpdate,
  type IArrayWillChange,
  type IArrayWillSplice,
  type IAtom,
  type IAutorunOptions,
  type IComputedFactory,
  type IComputedValue,
  type IComputedValueOptions,
  type IDepTreeNode,
  type IDependencyTree,
  type IEnhancer,
  type IEqualsComparer,
  type IInterceptable,
  type IInterceptor,
  type IKeyValueMap,
  type IListenable,
  type IMapDidChange,
  type IMapEntries,
  type IMapEntry,
  type IMapWillChange,
  type IObjectDidChange,
  type IObjectWillChange,
  type IObservable,
  type IObservableArray,
  type IObservableFactory,
  type IObservableMapInitialValues,
  type IObservableSetInitialValues,
  type IObservableValue,
  type IObserverTree,
  type IReactionDisposer,
  type IReactionOptions,
  type IReactionPublic,
  type ISetDidChange,
  type ISetWillChange,
  type IValueDidChange,
  type IValueWillChange,
  type IWhenOptions,
  type Lambda,
} from "mobx";
export {
  $mobx,
  FlowCancellationError,
  ObservableMap,
  ObservableSet,
  Reaction,
  defineProperty,
  ownKeys,
  autorun,
  comparer,
  configure,
  createAtom,
  entries,
  extendObservable,
  flow,
  flowResult,
  get,
  getAtom,
  getDebugName,
  getDependencyTree,
  getObserverTree,
  has,
  intercept,
  isAction,
  isComputed,
  isComputedProp,
  isFlow,
  isFlowCancellationError,
  isObservable,
  isObservableArray,
  isObservableMap,
  isObservableObject,
  isObservableProp,
  isObservableSet,
  isBoxedObservable,
  keys,
  makeAutoObservable,
  makeObservable,
  observe,
  onBecomeObserved,
  onBecomeUnobserved,
  onReactionError,
  override,
  reaction,
  remove,
  runInAction,
  set,
  spy,
  toJS,
  trace,
  transaction,
  untracked,
  values,
  when,
} from "mobx";

/**
 * MobX `action` decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Action decorator.
 */
export function Action(): IActionFactory {
  return action;
}

/**
 * MobX bound action decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Action decorator.
 */
export function BoundAction(): typeof action.bound {
  return action.bound;
}

/**
 * MobX `computed` decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Computed decorator.
 */
export function Computed(): IComputedFactory {
  return computed;
}

/**
 * MobX `observable` decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable decorator.
 */
export function Observable(): IObservableFactory {
  return observable;
}

/**
 * MobX shallow observable decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns `observable.shallow` decorator.
 */
export function ShallowObservable(): typeof observable.shallow {
  return observable.shallow;
}

/**
 * MobX ref observable decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns `observable.ref` decorator.
 */
export function RefObservable(): typeof observable.ref {
  return observable.ref;
}

/**
 * MobX deep observable decorator alias.
 *
 * @group MobX aliases
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns `observable.deep` decorator.
 */
export function DeepObservable(): typeof observable.deep {
  return observable.deep;
}
