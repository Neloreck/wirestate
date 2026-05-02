import * as mobx_dist_types_decorator_fills from "mobx/dist/types/decorator_fills";
import * as mobx_dist_internal from "mobx/dist/internal";
import * as mobx from "mobx";
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

declare function Observable(): mobx.IObservableFactory;
declare function ShallowObservable(): mobx_dist_internal.Annotation &
  PropertyDecorator &
  mobx_dist_types_decorator_fills.ClassAccessorDecorator &
  mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function RefObservable(): mobx_dist_internal.Annotation &
  PropertyDecorator &
  mobx_dist_types_decorator_fills.ClassAccessorDecorator &
  mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function DeepObservable(): mobx_dist_internal.Annotation &
  PropertyDecorator &
  mobx_dist_types_decorator_fills.ClassAccessorDecorator &
  mobx_dist_types_decorator_fills.ClassFieldDecorator;
declare function Action(): mobx.IActionFactory;
declare function Computed(): mobx.IComputedFactory;

export {
  Action,
  Computed,
  DeepObservable,
  Observable,
  RefObservable,
  ShallowObservable,
};
