import { LazyServiceIdentifier, type ServiceIdentifier } from "inversify";
import { action, computed, observable } from "mobx";

export {
  Container,
  ContainerModule,
  inject as Inject,
  injectable as Injectable,
  multiInject as MultiInject,
  named as Named,
  optional as Optional,
  tagged as Tagged,
  postConstruct as PostConstruct,
  preDestroy as PreDestroy,
  type ServiceIdentifier,
  bindingTypeValues as BindingType,
  bindingScopeValues as ScopeBindingType,
} from "inversify";
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

export function forwardRef<TInstance = unknown>(forward: () => ServiceIdentifier<TInstance>) {
  return new LazyServiceIdentifier(forward);
}
