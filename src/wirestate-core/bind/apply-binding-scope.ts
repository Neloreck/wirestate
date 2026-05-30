import type { BindInWhenOnFluentSyntax } from "inversify";

import { BindingScope as BindingScopeValues } from "../alias";
import { BindingScope } from "../types/provision";

/**
 * Applies an optional Inversify binding scope.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Fluent binding syntax returned by Inversify.
 * @param scope - Optional scope value from a Wirestate binding descriptor.
 */
export function applyBindingScope<T>(binding: BindInWhenOnFluentSyntax<T>, scope?: BindingScope): void {
  if (!scope) {
    return;
  }

  if (scope === BindingScopeValues.Transient) {
    binding.inTransientScope();
  } else if (scope === BindingScopeValues.Request) {
    binding.inRequestScope();
  } else {
    binding.inSingletonScope();
  }
}
