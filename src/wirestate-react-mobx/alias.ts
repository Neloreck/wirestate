import { action, computed, IActionFactory, IComputedFactory, IObservableFactory, observable } from "mobx";

/**
 * @group mobx
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
 * @group mobx-react
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
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns action decorator
 */
export function Action(): IActionFactory {
  return action;
}

/**
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns computed decorator
 */
export function Computed(): IComputedFactory {
  return computed;
}

/**
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns observable decorator
 */
export function Observable(): IObservableFactory {
  return observable;
}

/**
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns observable.shallow decorator
 */
export function ShallowObservable() {
  return observable.shallow;
}

/**
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns observable.ref decorator
 */
export function RefObservable() {
  return observable.ref;
}

/**
 * @group mobx-alias
 * @see {@link https://mobx.js.org/README.html}
 *
 * @returns observable.deep decorator
 */
export function DeepObservable() {
  return observable.deep;
}
