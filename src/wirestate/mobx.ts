import { action, computed, observable } from "mobx";

export {
  autorun,
  comparer,
  configure,
  flow,
  flowResult,
  isAction,
  isFlow,
  isFlowCancellationError,
  isObservable,
  makeAutoObservable,
  makeObservable,
  reaction,
  runInAction,
  toJS,
  when,
} from "mobx";
export { observer } from "mobx-react-lite";

export function Observable() {
  return observable;
}

export function ShallowObservable() {
  return observable.shallow;
}

export function RefObservable() {
  return observable.ref;
}

export function DeepObservable() {
  return observable.deep;
}

export function Action() {
  return action;
}

export function Computed() {
  return computed;
}
