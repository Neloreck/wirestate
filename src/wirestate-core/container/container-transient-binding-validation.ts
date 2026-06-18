import { getActivatedHandlerMetadata } from "../activation/on-activated";
import { getDeactivationHandlerMetadata } from "../activation/on-deactivation";
import { type InstanceBindingDescriptor } from "../binding/binding";
import { tokenToString } from "../binding/binding-tokens";
import { ERROR_CODE_INVALID_BINDING_SCOPE } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { getMessagingRegistrations } from "../plugin/messaging-registration";
import { getDeprovisionHandlerMetadata } from "../provision/on-deprovision";
import { getProvisionHandlerMetadata } from "../provision/on-provision";

/**
 * Rejects a transient instance binding whose class declares any wirestate
 * lifecycle or messaging handler.
 *
 * @remarks
 * A `Transient` instance binding is construct-and-forget: the container never owns
 * or tracks the instance, so none of the owned-lifecycle machinery
 * (`@OnActivated`/`@OnDeactivation`/`@OnProvision`/`@OnDeprovision`) and no
 * provision-scoped messaging subscription (`@OnEvent`/`@OnCommand`/`@OnQuery`) can
 * fire for it. Allowing the binding while the class declares such a handler would
 * silently drop it, so this fails fast at bind time.
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

  // A non-constructor value is a structural error the kernel's validateBinding reports.
  if (typeof value !== "function" || !value.prototype) {
    return;
  }

  const prototype: object = value.prototype as object;
  const offenders: Array<string> = [];

  if (getActivatedHandlerMetadata(prototype)) {
    offenders.push("@OnActivated");
  }

  if (getDeactivationHandlerMetadata(prototype)) {
    offenders.push("@OnDeactivation");
  }

  if (getProvisionHandlerMetadata(prototype)) {
    offenders.push("@OnProvision");
  }

  if (getDeprovisionHandlerMetadata(prototype)) {
    offenders.push("@OnDeprovision");
  }

  if (getMessagingRegistrations(prototype).length > 0) {
    offenders.push("a messaging handler (@OnEvent/@OnCommand/@OnQuery)");
  }

  if (offenders.length > 0) {
    throw new WirestateError(
      `Cannot bind '${tokenToString(binding.token)}' as a Transient instance: a transient instance binding ` +
        `must declare no lifecycle or messaging handlers, but found ${offenders.join(", ")}. ` +
        `Bind it as Singleton, or use a Transient factory binding.`,
      ERROR_CODE_INVALID_BINDING_SCOPE
    );
  }
}
