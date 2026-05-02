"use no memo";
import { action, computed, observable } from "mobx";
export {
  autorun,
  comparer,
  configure,
  flow,
  flowResult,
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
  makeAutoObservable,
  makeObservable,
  reaction,
  runInAction,
  toJS,
  when,
} from "mobx";
export { observer } from "mobx-react-lite";
function Observable() {
  return observable;
}
function ShallowObservable() {
  return observable.shallow;
}
function RefObservable() {
  return observable.ref;
}
function DeepObservable() {
  return observable.deep;
}
function Action() {
  return action;
}
function Computed() {
  return computed;
}
export {
  Action,
  Computed,
  DeepObservable,
  Observable,
  RefObservable,
  ShallowObservable,
}; //# sourceMappingURL=mobx.js.map
