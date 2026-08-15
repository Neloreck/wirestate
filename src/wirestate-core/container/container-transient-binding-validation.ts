import { type InstanceBindingDescriptor } from "../binding/binding";
import { tokenToString } from "../binding/binding-tokens";
import { ERROR_CODE_INVALID_BINDING_SCOPE } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { collectDeclaredLifecycleHandlers } from "./container-declared-lifecycle-handlers";

/**
 * Rejects a transient instance binding whose class declares any wirestate
 * lifecycle or messaging handler.
 *
 * @remarks
 * A `Transient` instance binding is construct-and-forget: the container never owns
 * or tracks the instance, so none of the owned-lifecycle machinery
 * (`@OnActivation`/`@OnDeactivation`/`@OnProvision`/`@OnDeprovision`) and no
 * provision-scoped messaging subscription (`@OnEvent`/`@OnCommand`/`@OnQuery`) can
 * fire for it. Allowing the binding while the class declares such a handler would
 * silently drop it, so this fails fast at bind time.
 *
 * Expects a structurally valid descriptor: `Container.bind` validates the shape first, so
 * a malformed descriptor reports its own error rather than this one.
 *
 * @internal
 *
 * @param binding - The transient instance binding descriptor to check.
 *
 * @throws {@link WirestateError} If the class (or an ancestor) declares any lifecycle
 * or messaging handler.
 */
export function validateTransientInstanceBinding(binding: InstanceBindingDescriptor): void {
  const value: unknown = binding.value;

  // A non-constructor value is a structural error, already reported by binding validation.
  if (typeof value !== "function" || !value.prototype) {
    return;
  }

  const offenders: Array<string> = collectDeclaredLifecycleHandlers(value.prototype as object);

  if (offenders.length > 0) {
    throw new WirestateError(
      `Cannot bind '${tokenToString(binding.token)}' as a Transient instance: a transient instance binding ` +
        `must declare no lifecycle or messaging handlers, but found ${offenders.join(", ")}. ` +
        `Bind it as a Singleton instance binding, or remove the handlers.`,
      ERROR_CODE_INVALID_BINDING_SCOPE
    );
  }
}
