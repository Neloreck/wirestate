import { getActivationHandlerMetadata } from "../activation/on-activation";
import { getDeactivationHandlerMetadata } from "../activation/on-deactivation";
import { getMessagingRegistrations } from "../plugin/messaging-registration";
import { getDeprovisionHandlerMetadata } from "../provision/on-deprovision";
import { getProvisionHandlerMetadata } from "../provision/on-provision";

/**
 * Display name used when a class declares any messaging handler.
 *
 * @internal
 */
const MESSAGING_HANDLER_NAME: string = "a messaging handler (@OnEvent/@OnCommand/@OnQuery)";

/**
 * Lists every owned-lifecycle and messaging handler a class declares, by decorator name.
 *
 * @remarks
 * Feeds the diagnostic message of the guards that reject a binding kind running no owned
 * lifecycle. Names are ordered by lifecycle phase, not by declaration order. Reads the
 * prototype chain, so an inherited handler counts as declared.
 *
 * @internal
 *
 * @param prototype - Class prototype to inspect.
 * @returns Decorator names found on the prototype, empty when the class declares none.
 */
export function collectDeclaredLifecycleHandlers(prototype: object): Array<string> {
  const declared: Array<string> = [];

  if (getActivationHandlerMetadata(prototype)) {
    declared.push("@OnActivation");
  }

  if (getDeactivationHandlerMetadata(prototype)) {
    declared.push("@OnDeactivation");
  }

  return declared.concat(collectDeclaredProvisionHandlers(prototype));
}

/**
 * Lists the provision-phase handlers a class declares, by decorator name.
 *
 * @remarks
 * These handlers make a class a provision participant, so provision force-activates it
 * and expects a tracked instance to run them against. A binding kind the container never
 * tracks cannot satisfy that, which is why the guards treat this set separately from the
 * activation-phase hooks.
 *
 * @internal
 *
 * @param prototype - Class prototype to inspect.
 * @returns Decorator names found on the prototype, empty when the class declares none.
 */
export function collectDeclaredProvisionHandlers(prototype: object): Array<string> {
  const declared: Array<string> = [];

  if (getProvisionHandlerMetadata(prototype)) {
    declared.push("@OnProvision");
  }

  if (getDeprovisionHandlerMetadata(prototype)) {
    declared.push("@OnDeprovision");
  }

  if (getMessagingRegistrations(prototype).length > 0) {
    declared.push(MESSAGING_HANDLER_NAME);
  }

  return declared;
}
