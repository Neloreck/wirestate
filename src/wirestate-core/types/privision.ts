import { ServiceIdentifier, bindingTypeValues, bindingScopeValues } from "inversify";

export type TBindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

export type TScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

export interface IInjectableDescriptor<T = unknown, V = unknown> {
  id: ServiceIdentifier<T>;
  value?: V;
  bindingType?: TBindingType;
  scopeBindingType?: TScopeBindingType;
  /**
   * Factory function for dynamic value bindings.
   * Used when type is set to DynamicValue.
   */
  factory?: () => T;
}
