import { validateStandardMethodContext } from "../metadata/metadata-decorator-context";
import { appendHandlerMetadata, appendStandardHandlerMetadata } from "../metadata/metadata-handlers";

import {
  MESSAGING_REGISTRATION_KEY,
  MESSAGING_REGISTRATIONS,
  type MessagingRegistration,
} from "./messaging-registration";

/**
 * Method decorator shape shared by the messaging handler decorators.
 *
 * @group Messaging
 * @internal
 */
export interface MessagingHandlerDecorator {
  // Standard (TC39):
  <This>(value: (this: This, ...args: Array<never>) => unknown, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Describes one messaging kind's handler decorator.
 *
 * @template M - Per-method metadata the decorator records.
 *
 * @group Messaging
 * @internal
 */
export interface MessagingDecoratorOptions<M> {
  /**
   * Decorator name used in diagnostics, for example `OnCommand`.
   */
  readonly name: string;

  /**
   * Legacy-decorator registry of per-method metadata, keyed by class constructor.
   */
  readonly registry: WeakMap<object, Array<M>>;

  /**
   * Standard-decorator metadata key the per-method metadata is stored under.
   */
  readonly metadataKey: symbol;

  /**
   * Registration that wires this kind's handlers onto its bus at provision.
   */
  readonly registration: MessagingRegistration;
}

/**
 * Builds the decorator factory behind one messaging kind.
 *
 * @group Messaging
 * @internal
 *
 * @template M - Per-method metadata the decorator records.
 *
 * @param options - Registry, metadata key, name, and registration of the kind.
 * @returns A function turning a metadata builder into a dual-mode method decorator.
 */
export function createMessagingDecorator<M>(
  options: MessagingDecoratorOptions<M>
): (describe: (methodName: string | symbol) => M) => MessagingHandlerDecorator {
  const { name, registry, metadataKey, registration } = options;

  return (describe: (methodName: string | symbol) => M): MessagingHandlerDecorator => {
    return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
      if (typeof nameOrContext === "object") {
        // Standard decorators:
        const metadata: DecoratorMetadataObject = validateStandardMethodContext(name, nameOrContext);

        appendStandardHandlerMetadata(metadata, metadataKey, describe(nameOrContext.name));
        appendStandardHandlerMetadata(metadata, MESSAGING_REGISTRATION_KEY, registration);
      } else {
        // Experimental legacy decorators:
        appendHandlerMetadata(registry, target.constructor, describe(nameOrContext));
        appendHandlerMetadata(MESSAGING_REGISTRATIONS, target.constructor, registration);
      }
    }) as MessagingHandlerDecorator;
  };
}
