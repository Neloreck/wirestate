/**
 * Binding descriptor shapes accepted by Wirestate registration APIs.
 *
 * @group Bind
 */
export type {
  BindingScopeValue,
  BindingDescriptor,
  ValueBindingDescriptor,
  InstanceBindingDescriptor,
  FactoryBindingDescriptor,
} from "../binding/binding";

import type { BindingDescriptor } from "../binding/binding";
import type { Newable } from "../utils/class-like";

/**
 * Identifier for one provider provision cycle of a service instance.
 *
 * @remarks
 * IDs are unique only within a single service instance. Use the value passed to
 * `@OnProvision` and `@OnDeprovision` with
 * `WireStatus.for(instance).provisionId` to ignore async work from an older
 * provision cycle.
 *
 * @group Container
 */
export type ProvisionId = number;

/**
 * Represents a single binding accepted by Wirestate registration APIs.
 *
 * @remarks
 * A binding is either a class {@link Newable} constructor or a {@link BindingDescriptor}
 * for values, factories, or custom-token class bindings.
 *
 * @group Bind
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Binding<T extends object = object> = Newable<T> | BindingDescriptor<any>;

/**
 * Represents bindings accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a class reference or an {@link BindingDescriptor}.
 *
 * @group Bind
 */
export type Bindings = ReadonlyArray<Binding>;
