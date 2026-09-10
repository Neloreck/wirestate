import { type ContainerConfig, Container, WirestateError } from "@wirestate/core";

import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";

/**
 * The two props that select a provider mode.
 *
 * @group Provision
 * @internal
 */
export interface ProviderModeProps {
  /**
   * External container instance, when the caller owns the container.
   */
  readonly container?: Container;

  /**
   * Managed container creation options, when the provider should own the container.
   */
  readonly config?: ContainerConfig;
}

/**
 * Which of the two provider modes the props select.
 *
 * @remarks
 * `external`: the caller owns the container and the provider only provisions it. `managed`: the
 * provider creates the container from `config`, owns it, and disposes it on unmount.
 *
 * @group Provision
 * @internal
 */
export type ProviderMode = "external" | "managed";

/**
 * Validates the provider props and decides which mode they select.
 *
 * @group Provision
 * @internal
 *
 * @param props - Provider props.
 * @returns The selected mode.
 *
 * @throws `WirestateError` if neither or both of `container` and `config` are given, or either is
 * not the kind of value it claims to be.
 */
export function resolveProviderMode(props: ProviderModeProps): ProviderMode {
  const hasContainer: boolean = props.container !== undefined;
  const hasConfig: boolean = props.config !== undefined;

  if (hasConfig && !isContainerConfig(props.config)) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (!hasContainer && !hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (hasContainer && hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires only container or valid config object to be provided.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (hasContainer && !(props.container instanceof Container)) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  return hasContainer ? "external" : "managed";
}

/**
 * Checks that a `config` prop is a plain options object rather than a primitive, `null`, or an array.
 *
 * @param config - Value passed as the `config` prop.
 * @returns Whether the value has the shape of a container config.
 */
function isContainerConfig(config: unknown): config is ContainerConfig {
  return config !== null && typeof config === "object" && !Array.isArray(config);
}
