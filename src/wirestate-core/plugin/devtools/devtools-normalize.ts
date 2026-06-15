import { WireStatus } from "../../activation/wire-status";
import type { BindingDescriptor, ServiceToken } from "../../binding/binding";
import { isInstanceDescriptor } from "../../binding/binding-guards";
import { getBindingScope } from "../../binding/binding-lifecycle";
import { InjectionToken, getBindingToken, tokenToString } from "../../binding/binding-tokens";
import type { Optional } from "../../types/general";
import type { WirestatePlugin } from "../plugin";

import type {
  DevtoolsBinding,
  DevtoolsInstance,
  DevtoolsInstanceStatus,
  DevtoolsPluginInfo,
  DevtoolsToken,
} from "./devtools-hook";

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
 * @returns The normalized binding.
 */
export function normalizeBinding(binding: BindingDescriptor<unknown>): DevtoolsBinding {
  return {
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
 * @returns The normalized instance.
 */
export function normalizeInstance(instance: object): DevtoolsInstance {
  return {
    token: normalizeToken(instance.constructor as ServiceToken),
    className: instance.constructor.name,
    status: readStatus(instance),
  };
}

/**
 * Reads an instance's lifecycle status without throwing for untracked instances.
 *
 * @param instance - Service instance to inspect.
 * @returns The normalized status, or `undefined` when the instance is not tracked.
 */
function readStatus(instance: object): Optional<DevtoolsInstanceStatus> {
  let status: Optional<WireStatus>;

  try {
    status = WireStatus.for(instance);
  } catch {
    return undefined;
  }

  return {
    isDeactivated: status.isDeactivated,
    isDeprovisioned: status.isDeprovisioned,
    isInactive: status.isInactive,
    provisionId: status.provisionId,
  };
}
