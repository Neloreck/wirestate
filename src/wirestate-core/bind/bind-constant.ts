import { Container, type ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ScopeBindingType } from "@/wirestate-core/alias";
import { ERROR_CODE_BINDING_SCOPE } from "@/wirestate-core/error/error-code";
import { WirestateError } from "@/wirestate-core/error/wirestate-error";
import type { InjectableDescriptor } from "@/wirestate-core/types/privision";

/**
 * Binds a constant value to a token in the container.
 *
 * @param container - target Inversify container
 * @param entry - entry descriptor to bind
 */
export function bindConstant<T>(container: Container, entry: InjectableDescriptor): void {
  dbg.info(prefix(__filename), "Binding constant:", {
    id: entry.id,
    value: entry.value,
    entry,
    container,
  });

  if (entry.scopeBindingType && entry.scopeBindingType !== ScopeBindingType.Singleton) {
    throw new WirestateError(ERROR_CODE_BINDING_SCOPE, "Provided unexpected binding scope for constant value.");
  }

  container.bind<T>(entry.id as ServiceIdentifier<T>).toConstantValue(entry.value as T);
}
