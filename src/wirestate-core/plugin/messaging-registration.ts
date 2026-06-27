import { type ServiceToken } from "../binding/binding";
import { type ContainerKernel } from "../container/container-kernel";
import { collectHandlerMetadata } from "../metadata/metadata-handlers";

/**
 * Self-contained wiring for one kind of messaging handler.
 *
 * @remarks
 * Each messaging decorator (`@OnEvent` / `@OnCommand` / `@OnQuery`) contributes
 * one registration per class, carrying the bus token it needs and a strategy
 * that wires an activated instance's handlers of that kind to the bus. The
 * activation dispatcher reads these generically and never imports a bus, so an
 * unused bus is never pulled into the bundle by the activation path.
 *
 * @group Container
 * @internal
 */
export interface MessagingRegistration {
  /**
   * Distinguishes the kind (one registration per kind survives per class).
   */
  readonly kind: symbol;

  /**
   * Bus this kind resolves and wires handlers onto.
   */
  readonly token: ServiceToken;

  /**
   * Wires the instance's handlers of this kind onto the bus.
   *
   * @param bus - The resolved bus instance.
   * @param instance - The activated instance.
   * @param container - Container that owns the instance.
   * @returns Teardown callbacks collected onto the activation record.
   */
  readonly register: (bus: object, instance: object, container: ContainerKernel) => Array<() => void>;
}

/**
 * Standard decorator metadata key for messaging registrations.
 *
 * @internal
 */
export const MESSAGING_REGISTRATION_KEY: symbol = Symbol.for("@wirestate/core/metadata/messaging-registration");

/**
 * Registry of class constructors to their messaging registrations (legacy decorators).
 *
 * @internal
 */
export const MESSAGING_REGISTRATIONS: WeakMap<object, Array<MessagingRegistration>> = new WeakMap();

/**
 * Collects the distinct messaging registrations declared across an instance's hierarchy.
 *
 * @remarks
 * A decorator appends its kind's registration once per decorated method. The
 * same kind is also re-declared by each class in a hierarchy. Both are collapsed
 * here so each kind wires exactly once per activation.
 *
 * @group Container
 * @internal
 *
 * @param instance - The instance to scan.
 * @returns One registration per declared kind.
 */
export function getMessagingRegistrations(instance: object): ReadonlyArray<MessagingRegistration> {
  const collected: ReadonlyArray<MessagingRegistration> = collectHandlerMetadata(
    instance,
    MESSAGING_REGISTRATIONS,
    MESSAGING_REGISTRATION_KEY
  );

  const seen: Set<symbol> = new Set();
  const unique: Array<MessagingRegistration> = [];

  for (const registration of collected) {
    if (seen.has(registration.kind)) {
      continue;
    }

    seen.add(registration.kind);
    unique.push(registration);
  }

  return unique;
}
