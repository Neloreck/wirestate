import { bindingScopeValues, BindInWhenOnFluentSyntax, Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IInjectableDescriptor } from "@/wirestate-core/types/privision";

/**
 * Binds a constant value to a token in the container.
 *
 * @param container - target Inversify container
 * @param entry - descriptor of entry to bind
 */
export function bindDynamicValue(container: Container, entry: IInjectableDescriptor): void {
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
