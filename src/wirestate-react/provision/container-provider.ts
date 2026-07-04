import { type ContainerConfig, Container, WirestateError } from "@wirestate/core";
import { type ReactElement, type ReactNode, createElement, useEffect, useRef, useState } from "react";

import { ContainerContext } from "../container/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { type Maybe, type Nullable } from "../types/general";

import {
  type ReactContainerProvisionLifecycle,
  retainContainer,
  scheduleContainerDestruction,
} from "./provision-lifecycle";

/**
 * Describes props for {@link ContainerProvider}.
 *
 * @remarks
 * Pass either `container` or `config`. Passing both is an error.
 *
 * @group Provision
 */
export interface ContainerProviderProps {
  /**
   * External container instance to provide as-is.
   *
   * @remarks
   * External container instances are provisioned by this provider, but never
   * disposed.
   */
  readonly container?: Container;

  /**
   * Managed container creation options.
   *
   * @remarks
   * Managed containers created from config are disposed on unmount and activate
   * all bindings by default unless `activate` is provided explicitly. The config
   * is read once when the provider mounts: later changes are ignored. Pass a
   * React `key` to the provider to recreate the container.
   */
  readonly config?: ContainerConfig;

  /**
   * React subtree that receives the active container.
   */
  readonly children?: ReactNode;
}

/**
 * Captures a provider provision failure so it can be thrown from render.
 */
interface ContainerProvisionError {
  readonly error: unknown;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * Two modes:
 *
 * - External `container`: passed through, provisioned, never disposed.
 * - Managed `config`: created by the provider, provisioned, disposed on unmount.
 *
 * Managed containers activate all bindings by default. Pass `activate: false`
 * to keep them lazy.
 *
 * Managed config is construction-only: it is read once when the provider
 * mounts, and later changes are ignored. Pass a React `key` to the provider
 * to recreate the container explicitly.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns React context provider for the active container.
 * @throws `WirestateError` if props are invalid or provider mode changes.
 *
 * @example
 * ```tsx
 * import { Injectable } from "@wirestate/core";
 * import { ContainerProvider } from "@wirestate/react";
 * import { useMemo } from "react";
 *
 * @Injectable()
 * class CounterService {}
 *
 * export function Application() {
 *   const config = useMemo(() => ({ bindings: [CounterService] }), []);
 *
 *   return (
 *     <ContainerProvider config={config}>
 *       <Counter />
 *     </ContainerProvider>
 *   );
 * }
 * ```
 */
export function ContainerProvider(props: ContainerProviderProps): ReactElement {
  const configValue: unknown = props.config;
  const hasConfig: boolean = configValue !== undefined;

  if (hasConfig && (configValue === null || typeof configValue !== "object" || Array.isArray(configValue))) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (!props.container && !hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (props.container && hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires only container or valid config object to be provided.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  } else if (props.container !== undefined && !(props.container instanceof Container)) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  const managedSource: Maybe<ContainerConfig> = props.config;
  const externalContainer: Maybe<Container> = props.container;
  const owned: boolean = Boolean(managedSource);
  const ownedRef = useRef<boolean>(owned);

  const pendingDestructionRef = useRef<Nullable<ReactContainerProvisionLifecycle>>(null);

  const [error, setError] = useState<Nullable<ContainerProvisionError>>(null);
  const [managedContainer] = useState<Nullable<Container>>(() =>
    managedSource ? new Container({ ...managedSource, activate: managedSource.activate ?? true }) : null
  );

  if (ownedRef.current !== owned) {
    throw new WirestateError(
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  const activeContainer: Container = managedContainer ?? (externalContainer as Container);

  useEffect(() => {
    const pendingDestruction: ReactContainerProvisionLifecycle = (pendingDestructionRef.current ??= new Map());

    retainContainer(activeContainer, pendingDestruction);

    try {
      activeContainer.provision();
    } catch (error) {
      if (owned) {
        scheduleContainerDestruction(activeContainer, pendingDestruction);
      } else {
        // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
        activeContainer.deprovision();
      }

      setError({ error });

      return;
    }

    return () => {
      if (owned) {
        scheduleContainerDestruction(activeContainer, pendingDestruction);
      } else {
        activeContainer.deprovision();
      }
    };
  }, [activeContainer, owned]);

  if (error) {
    throw error.error;
  }

  return createElement(ContainerContext.Provider, { value: activeContainer }, props.children ?? null);
}
