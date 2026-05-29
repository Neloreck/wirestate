import type { BindInWhenOnFluentSyntax } from "inversify";

import { ScopeBindingType as ScopeBinding } from "../alias";
import { ScopeBindingType } from "../types/provision";

/**
 * Applies an optional Inversify binding scope.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Fluent binding syntax returned by Inversify.
 * @param scopeBindingType - Optional scope value from a Wirestate binding descriptor.
 */
export function applyBindingScope<T>(binding: BindInWhenOnFluentSyntax<T>, scopeBindingType?: ScopeBindingType): void {
  if (!scopeBindingType) {
    return;
  }

  if (scopeBindingType === ScopeBinding.Transient) {
    binding.inTransientScope();
  } else if (scopeBindingType === ScopeBinding.Request) {
    binding.inRequestScope();
  } else {
    binding.inSingletonScope();
  }
}
