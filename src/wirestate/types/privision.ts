import { ServiceIdentifier, bindingTypeValues, bindingScopeValues } from "inversify";

export type TBindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

export type TScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

export interface IInjectableDescriptor<T = unknown, V = unknown> {
  id: ServiceIdentifier<T>;
  value: V;
  type?: TBindingType;
  scopeType?: TScopeBindingType;
}
