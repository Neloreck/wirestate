import { bindingScopeValues, BindInWhenOnFluentSyntax, Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { InjectableDescriptor } from "../types/privision";

/**
 * Binds a constant value to a token in the container.
 *
 * @group bind
 *
 * @param container - Target Inversify container.
 * @param entry - Descriptor of entry to bind.
 */
export function bindDynamicValue(container: Container, entry: InjectableDescriptor): void {
  dbg.info(prefix(__filename), "Binding constant:", {
    entry,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<unknown> = container.bind(entry.id).toDynamicValue(() => {
    if (entry.factory) {
      return entry.factory();
    }

    return entry.value;
  });

  if (!entry.scopeBindingType) {
    return;
  } else if (entry.scopeBindingType === bindingScopeValues.Transient) {
    binding.inTransientScope();
  } else if (entry.scopeBindingType === bindingScopeValues.Request) {
    binding.inRequestScope();
  } else {
    binding.inSingletonScope();
  }
}
