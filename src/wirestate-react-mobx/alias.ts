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
  isBoxedObservable,
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
  observer,
  enableStaticRendering,
  Observer,
  observerBatching,
  isObserverBatched,
  isUsingStaticRendering,
  useObserver,
  useLocalObservable,
  useLocalStore,
  useAsObservableSource,
  clearTimers,
} from "mobx-react-lite";

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Action decorator.
 */
export function Action(): IActionFactory {
  return action;
}

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Computed decorator.
 */
export function Computed(): IComputedFactory {
  return computed;
}

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable decorator.
 */
export function Observable(): IObservableFactory {
  return observable;
}

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.shallow decorator.
 */
export function ShallowObservable() {
  return observable.shallow;
}

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.ref decorator.
 */
export function RefObservable() {
  return observable.ref;
}

/**
 * @group Mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns Observable.deep decorator.
 */
export function DeepObservable() {
  return observable.deep;
}
