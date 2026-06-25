import { getActivatedHandlerMetadata } from "../../activation/on-activated";
import { getDeactivationHandlerMetadata } from "../../activation/on-deactivation";
import { WireStatus } from "../../activation/wire-status";
import { type BindingDescriptor, type ServiceToken } from "../../binding/binding";
import { isInstanceDescriptor } from "../../binding/binding-guards";
import { getBindingScope } from "../../binding/binding-lifecycle";
import { InjectionToken, getBindingToken, tokenToString } from "../../binding/binding-tokens";
import { getDeprovisionHandlerMetadata } from "../../provision/on-deprovision";
import { getProvisionHandlerMetadata } from "../../provision/on-provision";
import { type Optional } from "../../types/general";
import { getCommandHandlerMetadata } from "../commands/on-command";
import { getEventHandlerMetadata } from "../events/events-registry";
import { type WirestatePlugin } from "../plugin";
import { getQueryHandlerMetadata } from "../queries/on-query";

import {
  type DevtoolsBinding,
  type DevtoolsBindingId,
  type DevtoolsHandler,
  type DevtoolsInstance,
  type DevtoolsInstanceId,
  type DevtoolsInstanceStatus,
  type DevtoolsLifecycleHook,
  type DevtoolsLifecycleHookMethod,
  type DevtoolsMethod,
  type DevtoolsPluginInfo,
  type DevtoolsToken,
} from "./devtools-hook.types";

/**
 * The four lifecycle hooks and their metadata readers, in setup-to-teardown display order.
 */
const LIFECYCLE_HOOK_READERS: ReadonlyArray<
  readonly [DevtoolsLifecycleHook, (instance: object) => Optional<string | symbol>]
> = [
  ["onActivated", getActivatedHandlerMetadata],
  ["onProvision", getProvisionHandlerMetadata],
  ["onDeprovision", getDeprovisionHandlerMetadata],
  ["onDeactivation", getDeactivationHandlerMetadata],
];

/**
 * Normalizes a service token into a display-ready record.
 *
 * @param token - Token to normalize.
 * @returns The normalized token.
 */
export function normalizeToken(token: ServiceToken): DevtoolsToken {
  return { name: tokenToString(token), kind: tokenKind(token) };
}

/**
 * Classifies a token for the panel.
 *
 * @param token - Token to classify.
 * @returns The token's category.
 */
function tokenKind(token: ServiceToken): DevtoolsToken["kind"] {
  if (typeof token === "function") {
    return "class";
  } else if (typeof token === "symbol") {
    return "symbol";
  } else if (token instanceof InjectionToken) {
    return "injectionToken";
  }

  return "string";
}

/**
 * Normalizes a binding descriptor into a display-ready record.
 *
 * @param binding - Binding descriptor to normalize.
 * @param bindingId - Stable id the hook allocated for this binding descriptor.
 * @returns The normalized binding.
 */
export function normalizeBinding(binding: BindingDescriptor<unknown>, bindingId: DevtoolsBindingId): DevtoolsBinding {
  return {
    bindingId,
    token: normalizeToken(getBindingToken(binding)),
    type: binding.type ?? "Value",
    scope: getBindingScope(binding),
    implementation: isInstanceDescriptor(binding) ? binding.value.name : undefined,
  };
}

/**
 * Normalizes a registered plugin into a display-ready record.
 *
 * @param plugin - Plugin to normalize.
 * @returns The normalized plugin.
 */
export function normalizePlugin(plugin: WirestatePlugin): DevtoolsPluginInfo {
  return {
    name: plugin.constructor.name,
    handles: (plugin.handles ?? []).map((kind: symbol): string => kind.description ?? String(kind)),
  };
}

/**
 * Normalizes a service instance into a display-ready record.
 *
 * @param instance - Service instance to normalize.
 * @param instanceId - Stable id the hook allocated for this instance.
 * @returns The normalized instance.
 */
export function normalizeInstance(instance: object, instanceId: DevtoolsInstanceId): DevtoolsInstance {
  return {
    instanceId,
    token: normalizeToken(instance.constructor as ServiceToken),
    className: instance.constructor.name,
    status: readStatus(instance),
    handlers: normalizeHandlers(instance),
    methods: normalizeMethods(instance),
    lifecycle: normalizeLifecycle(instance),
  };
}

/**
 * Reads the lifecycle hooks a service instance declares via decorators.
 *
 * @param instance - Service instance to inspect.
 * @returns The declared hooks, one record per hook, in setup-to-teardown order.
 */
function normalizeLifecycle(instance: object): ReadonlyArray<DevtoolsLifecycleHookMethod> {
  const lifecycle: Array<DevtoolsLifecycleHookMethod> = [];

  for (const [hook, read] of LIFECYCLE_HOOK_READERS) {
    try {
      const method: Optional<string | symbol> = read(instance);

      if (method !== undefined) {
        lifecycle.push({ hook, method: String(method) });
      }
    } catch {
      // Skip a hook whose metadata read throws.
    }
  }

  return lifecycle;
}

/**
 * Reads the message handlers/subscribers a service instance declares via decorators.
 *
 * @param instance - Service instance to inspect.
 * @returns The declared handlers, one record per channel/type.
 */
function normalizeHandlers(instance: object): ReadonlyArray<DevtoolsHandler> {
  const handlers: Array<DevtoolsHandler> = [];

  for (const meta of getCommandHandlerMetadata(instance)) {
    handlers.push({ channel: "command", type: String(meta.type), method: String(meta.methodName) });
  }

  for (const meta of getQueryHandlerMetadata(instance)) {
    handlers.push({ channel: "query", type: String(meta.type), method: String(meta.methodName) });
  }

  for (const meta of getEventHandlerMetadata(instance)) {
    const types: ReadonlyArray<string> = meta.types ? meta.types.map((type) => String(type)) : ["*"];

    for (const type of types) {
      handlers.push({ channel: "event", type, method: String(meta.methodName) });
    }
  }

  return handlers;
}

/**
 * Enumerates the methods declared on a service instance's class and its base classes.
 *
 * @param instance - Service instance to inspect.
 * @returns The declared methods (name + arity), in prototype-walk order.
 */
function normalizeMethods(instance: object): ReadonlyArray<DevtoolsMethod> {
  const methods: Array<DevtoolsMethod> = [];
  const seen: Set<string> = new Set();

  let prototype: Optional<object> = Object.getPrototypeOf(instance) as Optional<object>;

  while (prototype && prototype !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(prototype)) {
      if (name === "constructor" || seen.has(name)) {
        continue;
      }

      // Mark the name seen even for accessors/non-functions, so a base method it shadows is skipped.
      seen.add(name);

      const descriptor: Optional<PropertyDescriptor> = Object.getOwnPropertyDescriptor(prototype, name);

      if (descriptor && typeof descriptor.value === "function") {
        methods.push({ name, arity: (descriptor.value as (...args: ReadonlyArray<unknown>) => unknown).length });
      }
    }

    prototype = Object.getPrototypeOf(prototype) as Optional<object>;
  }

  return methods;
}

/**
 * Reads an instance's lifecycle status without throwing for untracked instances.
 *
 * @param instance - Service instance to inspect.
 * @returns The normalized status, or `undefined` when the instance is not tracked.
 */
function readStatus(instance: object): Optional<DevtoolsInstanceStatus> {
  try {
    const status: Optional<WireStatus> = WireStatus.for(instance);

    return {
      isDeactivated: status.isDeactivated,
      isDeprovisioned: status.isDeprovisioned,
      isInactive: status.isInactive,
      provisionId: status.provisionId,
    };
  } catch {
    return undefined;
  }
}
