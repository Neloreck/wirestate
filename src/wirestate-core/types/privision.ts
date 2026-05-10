import { ServiceIdentifier, bindingTypeValues, bindingScopeValues } from "inversify";

/**
 * @group bind
 */
export type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

/**
 * @group bind
 */
export type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

/**
 * @group bind
 */
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
