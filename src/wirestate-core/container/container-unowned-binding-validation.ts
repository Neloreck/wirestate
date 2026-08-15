import { type BindingDescriptor } from "../binding/binding";
import { getBindingType } from "../binding/binding-lifecycle";
import { tokenToString } from "../binding/binding-tokens";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { collectDeclaredProvisionHandlers } from "./container-declared-lifecycle-handlers";

/**
 * Rejects a value or factory binding whose class token declares a provision-phase
 * handler.
 *
 * @remarks
 * Only an `Instance` binding gives the container an instance it owns. A value binding
 * stores what the caller built and a factory binding hands back what the factory
 * returned, so neither is tracked as a service instance.
 *
 * A provision-phase handler makes the class a provision participant, and provision needs
 * a tracked instance to run it against. Rejecting the binding here fails fast, instead of
 * letting provision fail later on an untracked instance.
 *
 * The activation-phase hooks (`@OnActivation`/`@OnDeactivation`) stay allowed. Nothing
 * recruits them for these binding kinds, so they are inert rather than broken.
 *
 * Only a class token is inspected, because that is where provision reads metadata from.
 * A string, symbol, or `InjectionToken` carries none.
 *
 * Expects a structurally valid descriptor: `Container.bind` validates the shape first, so
 * a malformed descriptor reports its own error rather than this one.
 *
 * @internal
 *
 * @param binding - The value or factory binding descriptor to check.
 *
 * @throws {@link WirestateError} If the class token (or an ancestor) declares a
 * provision-phase handler.
 */
export function validateUnownedBinding(binding: BindingDescriptor): void {
  const token: unknown = binding.token;

  // A non-constructor token carries no lifecycle metadata, so there is nothing to reject.
  if (typeof token !== "function" || !token.prototype) {
    return;
  }

  const declared: Array<string> = collectDeclaredProvisionHandlers(token.prototype as object);

  if (declared.length === 0) {
    return;
  }

  throw new WirestateError(
    `Cannot bind '${tokenToString(binding.token)}' as a ${getBindingType(binding)} binding: the container ` +
      `does not own the value it produces, so no lifecycle or messaging handler can fire for it, but the class ` +
      `declares ${declared.join(", ")}. Bind it as an Instance binding so the container owns the instance, or ` +
      `remove the handlers.`,
    ERROR_CODE_INVALID_ARGUMENTS
  );
}
