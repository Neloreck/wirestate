import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, Newable, ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindDynamicValue } from "./bind-dynamic-value";
import { bindService, bindServiceWithToken, type BindServiceOptions } from "./bind-service";
import { validateInjectableDescriptor } from "./validate-injectable-descriptor";

const SUPPORTED_BINDING_TYPES: ReadonlyArray<string> = [
  BindingType.ConstantValue,
  BindingType.DynamicValue,
  BindingType.Instance,
  // ? -> "Factory" | "ResolvedValue" | "ServiceRedirection";
];

/**
 * Validates descriptor fields needed before {@link bindEntry} dispatches to a concrete binding helper.
 *
 * @group Bind
 * @internal
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor uses an unsupported binding type or an invalid instance value.
 */
function validateEntryDescriptor(entry: InjectableDescriptor): void {
  validateInjectableDescriptor(entry);

  const bindingType: string = entry.bindingType ?? BindingType.ConstantValue;

  if (!SUPPORTED_BINDING_TYPES.includes(bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Unsupported binding type '${bindingType}'. Supported binding types: ${SUPPORTED_BINDING_TYPES.join(", ")}.`
    );
  }

  if (bindingType === BindingType.Instance && typeof entry.value !== "function") {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Instance descriptor 'value' must be a service constructor."
    );
  }
}

/**
 * Represents options for {@link bindEntry}.
 *
 * @group Bind
 */
export interface BindEntryOptions extends BindServiceOptions {
  /**
   * Skip service lifecycle hooks for class entries.
   *
   * @default `false`
   */
  readonly isWithIgnoreLifecycle?: boolean;
}

/**
 * Binds a class or descriptor into a container.
 *
 * @remarks
 * `bindEntry` is the router behind `createContainer({ entries })`.
 *
 * It chooses the right binding helper:
 *
 * - Class constructor: singleton service via {@link bindService}.
 * - `ConstantValue`: fixed value via {@link bindConstant}.
 * - `DynamicValue`: factory value via {@link bindDynamicValue}.
 * - `Instance`: service class behind a custom token.
 *
 * @group Bind
 *
 * @template T - Bound object type.
 *
 * @param container - Container to bind into.
 * @param entry - Service class or descriptor.
 * @param options - Binding options for class entries.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 *
 * @example
 * ```typescript
 * import { BindingType, Injectable, bindEntry, createContainer } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * @Injectable()
 * class UserService {}
 *
 * const container = createContainer();
 *
 * bindEntry(container, UserService);
 * bindEntry(container, {
 *   id: API_URL,
 *   bindingType: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * });
 * ```
 */
export function bindEntry<T extends object = object>(
  container: Container,
  entry: Newable<T> | InjectableDescriptor,
  options: BindEntryOptions = {}
): void {
  if (typeof entry === "function") {
    bindService(container, entry, options);

    return;
  }

  validateEntryDescriptor(entry);

  if (!entry.bindingType || entry.bindingType === BindingType.ConstantValue) {
    bindConstant(container, entry);

    return;
  }

  if (entry.bindingType === BindingType.DynamicValue) {
    dbg.info(prefix(__filename), "Binding dynamic value entry:", {
      entry,
      container,
    });

    bindDynamicValue(container, entry);

    return;
  }

  dbg.info(prefix(__filename), "Binding instance entry:", {
    entry,
    container,
  });

  bindServiceWithToken(
    container,
    entry.id as ServiceIdentifier<T>,
    entry.value as unknown as Newable<T>,
    entry,
    options
  );
}
