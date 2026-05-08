import { ServiceIdentifier, bindingTypeValues, bindingScopeValues } from "inversify";

export type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

export type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

export interface InjectableDescriptor<T = unknown, V = unknown> {
  id: ServiceIdentifier<T>;
  value?: V;
  bindingType?: BindingType;
  scopeBindingType?: ScopeBindingType;
  /**
   * Factory function for dynamic value bindings.
   * Used when type is set to DynamicValue.
   */
  factory?: () => T;
}
