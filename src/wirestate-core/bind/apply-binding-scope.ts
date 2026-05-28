import type { BindInWhenOnFluentSyntax } from "inversify";

import { ScopeBindingType } from "../alias";
import { BindingDescriptor } from "../types/provision";

/**
 * Applies an optional Inversify binding scope.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Fluent binding syntax returned by Inversify.
 * @param scopeBindingType - Optional scope value from a Wirestate binding descriptor.
 */
export function applyBindingScope<T>(
  binding: BindInWhenOnFluentSyntax<T>,
  scopeBindingType: BindingDescriptor["scopeBindingType"]
): void {
  if (!scopeBindingType) {
    return;
  }

  if (scopeBindingType === ScopeBindingType.Transient) {
    binding.inTransientScope();
  } else if (scopeBindingType === ScopeBindingType.Request) {
    binding.inRequestScope();
  } else {
    binding.inSingletonScope();
  }
}
