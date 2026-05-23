import { bindingScopeValues, bindingTypeValues } from "inversify";

import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/provision";

const SUPPORTED_BINDING_TYPES: ReadonlyArray<string> = [
  bindingTypeValues.ConstantValue,
  bindingTypeValues.DynamicValue,
  bindingTypeValues.Instance,
];

function hasOwn(entry: InjectableDescriptor, key: keyof InjectableDescriptor): boolean {
  return Object.prototype.hasOwnProperty.call(entry, key);
}

function validateDescriptorBase(entry: InjectableDescriptor): void {
  if (!hasOwn(entry, "id") || entry.id === undefined || entry.id === null) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Injectable descriptor must provide an 'id' token.");
  }

  if (entry.bindingType !== undefined && !Object.values(bindingTypeValues).includes(entry.bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Injectable descriptor has unknown binding type '${String(entry.bindingType)}'.`
    );
  }

  if (entry.scopeBindingType !== undefined && !Object.values(bindingScopeValues).includes(entry.scopeBindingType)) {
    throw new WirestateError(
      ERROR_CODE_BINDING_SCOPE,
      `Injectable descriptor has unknown scope binding type '${String(entry.scopeBindingType)}'.`
    );
  }
}

/**
 * Validates a constant-value descriptor.
 *
 * @group Bind
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor cannot be bound as a constant value.
 */
export function validateConstantDescriptor(entry: InjectableDescriptor): void {
  validateDescriptorBase(entry);

  if (entry.bindingType !== undefined && entry.bindingType !== bindingTypeValues.ConstantValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindConstant expected binding type '${bindingTypeValues.ConstantValue}'.`
    );
  }

  if (!hasOwn(entry, "value")) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Constant value descriptor must provide a 'value' property."
    );
  }
}

/**
 * Validates a dynamic-value descriptor.
 *
 * @group Bind
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor cannot be bound as a dynamic value.
 */
export function validateDynamicValueDescriptor(entry: InjectableDescriptor): void {
  validateDescriptorBase(entry);

  if (entry.bindingType !== undefined && entry.bindingType !== bindingTypeValues.DynamicValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindDynamicValue expected binding type '${bindingTypeValues.DynamicValue}'.`
    );
  }

  if (!hasOwn(entry, "factory") && !hasOwn(entry, "value")) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Dynamic value descriptor must provide either a 'factory' or 'value' property."
    );
  }

  if (hasOwn(entry, "factory") && entry.factory !== undefined && typeof entry.factory !== "function") {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Dynamic value descriptor 'factory' must be a function.");
  }
}

/**
 * Validates a class instance descriptor.
 *
 * @group Bind
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor cannot be bound as a service instance.
 */
export function validateInstanceDescriptor(entry: InjectableDescriptor): void {
  validateDescriptorBase(entry);

  if (entry.bindingType !== bindingTypeValues.Instance) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindEntry expected binding type '${bindingTypeValues.Instance}'.`
    );
  }

  if (typeof entry.value !== "function") {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Instance descriptor 'value' must be a service constructor."
    );
  }
}

/**
 * Validates a descriptor before dispatching it to a concrete binding helper.
 *
 * @group Bind
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor cannot be bound by Wirestate.
 */
export function validateInjectableDescriptor(entry: InjectableDescriptor): void {
  validateDescriptorBase(entry);

  const bindingType: string = entry.bindingType ?? bindingTypeValues.ConstantValue;

  if (!SUPPORTED_BINDING_TYPES.includes(bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Unsupported binding type '${bindingType}'. Supported binding types: ${SUPPORTED_BINDING_TYPES.join(", ")}.`
    );
  }

  if (bindingType === bindingTypeValues.ConstantValue) {
    validateConstantDescriptor(entry);
  } else if (bindingType === bindingTypeValues.DynamicValue) {
    validateDynamicValueDescriptor(entry);
  } else {
    validateInstanceDescriptor(entry);
  }
}
