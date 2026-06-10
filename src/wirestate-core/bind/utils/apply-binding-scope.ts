import { BindingScope as BindingScopeValues } from "../../alias";
import type { ProviderScope } from "../../base";
import { BindingScope } from "../../types/provision";

/**
 * Maps a Wirestate binding scope to the base container provider scope.
 *
 * @group Bind
 * @internal
 *
 * @param scope - Wirestate binding scope, if declared.
 * @returns Matching provider scope, or `undefined` when not declared.
 */
export function toProviderScope(scope?: BindingScope): ProviderScope | undefined {
  if (!scope) {
    return undefined;
  }

  return scope === BindingScopeValues.Transient ? "transient" : "singleton";
}
