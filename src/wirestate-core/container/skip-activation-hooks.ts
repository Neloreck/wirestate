import { Binding, BindingType, InstanceBindingDescriptor } from "../binding/binding";

/**
 * Stamps the `skipActivationHooks` option onto instance bindings.
 *
 * @remarks
 * Bare classes are expanded to instance descriptors carrying the flag, and
 * instance descriptors are copied with it. A descriptor's own
 * `skipActivationHooks` field wins over the option. Value and factory bindings
 * have no activation hooks to skip and pass through unchanged.
 *
 * @group Container
 * @internal
 *
 * @param binding - Service class or binding descriptor.
 * @param skipActivationHooks - Whether instance bindings should skip activation hooks.
 * @returns The binding to register on the container.
 */
export function applySkipActivationHooks(binding: Binding, skipActivationHooks?: boolean): Binding {
  if (!skipActivationHooks) {
    return binding;
  }

  if (typeof binding === "function") {
    return { token: binding, type: BindingType.Instance, value: binding, skipActivationHooks: true };
  }

  if (binding.type === BindingType.Instance) {
    const descriptor: InstanceBindingDescriptor = binding as InstanceBindingDescriptor;

    return { ...descriptor, skipActivationHooks: descriptor.skipActivationHooks ?? true };
  }

  return binding;
}
