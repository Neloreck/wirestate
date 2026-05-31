import {
  Container,
  ContainerConfig,
  createContainer,
  deprovisionContainer,
  provisionContainer,
  WirestateError,
} from "@wirestate/core";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { AnyObject, Maybe, Optional } from "../types/general";
import { shallowEqualActivation, shallowEqualArrays, shallowEqualObjects } from "../utils/shallow-equal";

import { ProvisionLifecycle, retainContainer, scheduleContainerDestruction } from "./provision-lifecycle";

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
   * all bindings by default unless `activate` is provided explicitly. Managed
   * containers are recreated when the normalized config changes by shallow
   * comparison.
   */
  readonly config?: ContainerConfig;

  /**
   * React subtree that receives the active container.
   */
  readonly children?: ReactNode;
}

/**
 * Active provider state stored in the component state.
 */
interface ContainerProviderState {
  readonly container: Container;
  readonly source: ContainerConfig;
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
 * @group Provision
 *
 * @param props - Provider props.
 * @returns React context provider for the active container.
 * @throws {WirestateError} If props are invalid or provider mode changes.
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
export function ContainerProvider(props: ContainerProviderProps) {
  const configValue: unknown = props.config;
  const hasConfig: boolean = configValue !== undefined;

  if (hasConfig && (configValue === null || typeof configValue !== "object" || Array.isArray(configValue))) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (!props.container && !hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (props.container && hasConfig) {
    throw new WirestateError(
      "ContainerProvider requires only container or valid config object to be provided.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (props.container !== undefined && !(props.container instanceof Container)) {
    throw new WirestateError(
      "ContainerProvider requires a valid container instance or creation config.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  const managedSource: Maybe<ContainerConfig> = props.config;
  const externalContainer: Maybe<Container> = props.container;
  const owned: boolean = Boolean(managedSource);
  const ownedRef = useRef<boolean>(owned);

  const lifecycleRef = useRef<Optional<ProvisionLifecycle>>(null);
  const normalizedSource: Maybe<ContainerConfig> = managedSource
    ? { ...managedSource, activate: managedSource.activate ?? true }
    : null;

  const [state, setState] = useState<Optional<ContainerProviderState>>(() =>
    normalizedSource
      ? {
          container: createContainer(normalizedSource),
          source: normalizedSource,
        }
      : null
  );

  if (ownedRef.current !== owned) {
    throw new WirestateError(
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  const needsReplacement: boolean = Boolean(
    state &&
    normalizedSource &&
    (state.source.parent !== normalizedSource.parent ||
      !shallowEqualObjects(state.source.seed, normalizedSource.seed) ||
      !shallowEqualObjects(state.source.seeds as Maybe<AnyObject>, normalizedSource.seeds as Maybe<AnyObject>) ||
      !shallowEqualArrays(state.source.bindings, normalizedSource.bindings) ||
      !shallowEqualActivation(state.source.activate, normalizedSource.activate))
  );

  let activeState: Optional<ContainerProviderState> = state;

  if (needsReplacement && normalizedSource) {
    activeState = {
      container: createContainer(normalizedSource),
      source: normalizedSource,
    };

    setState(activeState);
  }

  const activeContainer: Container = activeState ? activeState.container : (externalContainer as Container);

  useEffect(() => {
    const lifecycle: ProvisionLifecycle = (lifecycleRef.current ??= {
      pendingDestruction: new Map(),
      provisionedServices: new Map(),
    } as ProvisionLifecycle);

    retainContainer(activeContainer, lifecycle);
    provisionContainer(activeContainer, lifecycle.provisionedServices);

    return () => {
      if (owned) {
        scheduleContainerDestruction(activeContainer, lifecycle);
      } else {
        deprovisionContainer(activeContainer, lifecycle.provisionedServices);
      }
    };
  }, [activeContainer, owned]);

  return createElement(ContainerReactContext.Provider, { value: activeContainer }, props.children ?? null);
}
