import { action, computed, IActionFactory, IComputedFactory, IObservableFactory, observable } from "mobx";

/**
 * @group Mobx
 * @see {@link https://mobx.js.org/README.html}
 */
export {
  $mobx,
  AnnotationMapEntry,
  AnnotationsMap,
  CreateObservableOptions,
  FlowCancellationError,
  IActionFactory,
  IActionRunInfo,
  IArrayDidChange,
  IArraySplice,
  IArrayUpdate,
  IArrayWillChange,
  IArrayWillSplice,
  IAtom,
  IAutorunOptions,
  IComputedFactory,
  IComputedValue,
  IComputedValueOptions,
  IDepTreeNode,
  IDependencyTree,
  IEnhancer,
  IEqualsComparer,
  IInterceptable,
  IInterceptor,
  IKeyValueMap,
  IListenable,
  IMapDidChange,
  IMapEntries,
  IMapEntry,
  IMapWillChange,
  IObjectDidChange,
  IObjectWillChange,
  IObservable,
  IObservableArray,
  IObservableFactory,
  IObservableMapInitialValues,
  IObservableSetInitialValues,
  IObservableValue,
  IObserverTree,
  IReactionDisposer,
  IReactionOptions,
  IReactionPublic,
  ISetDidChange,
  ISetWillChange,
  IValueDidChange,
  IValueWillChange,
  IWhenOptions,
  Lambda,
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
 * @group Mobx-react
 * @see {@link https://mobx.js.org/react-integration.html}
 */
export {
  Observer,
  clearTimers,
  enableStaticRendering,
  isObserverBatched,
  isUsingStaticRendering,
  observer,
  observerBatching,
  useAsObservableSource,
  useLocalObservable,
  useLocalStore,
  useObserver,
} from "mobx-react-lite";

/**
 * MobX `action` decorator alias.
 *
 * @group Mobx-alias
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
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Action decorator.
 */
export function BoundAction() {
  return action.bound;
}

/**
 * MobX `computed` decorator alias.
 *
 * @group Mobx-alias
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
 * @group Mobx-alias
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
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.shallow decorator.
 */
export function ShallowObservable() {
  return observable.shallow;
}

/**
 * MobX ref observable decorator alias.
 *
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.ref decorator.
 */
export function RefObservable() {
  return observable.ref;
}

/**
 * MobX deep observable decorator alias.
 *
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.deep decorator.
 */
export function DeepObservable() {
  return observable.deep;
}
