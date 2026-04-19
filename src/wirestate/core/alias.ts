import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";
import { action, computed, observable } from "mobx";

export { Container, inject as Inject, injectable as Injectable, type ServiceIdentifier } from "inversify";
export {
  autorun,
  flow,
  flowResult,
  isFlow,
  isFlowCancellationError,
  makeAutoObservable,
  makeObservable,
  runInAction,
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

export function forwardRef<TInstance = unknown>(forward: () => ServiceIdentifier<TInstance>) {
  return new LazyServiceIdentifier(forward);
}
