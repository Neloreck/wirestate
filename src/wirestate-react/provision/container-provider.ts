import {
  Container,
  ContainerConfig,
  createContainer,
  deprovisionContainer,
  getContainerEntries,
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
 * Represents props accepted by {@link ContainerProvider}.
 *
 * @remarks
 * Provide either an external `container` or managed creation `config`, but
 * never both at the same time.
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
   * all entries by default unless `activate` is provided explicitly. Managed
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
 * Two modes are supported:
 *
 * - External: `container` is a prebuilt {@link Container}. The provider only
 *   passes it through context, runs provision hooks, and never disposes it.
 * - Managed: `config` is {@link ContainerConfig}. The provider
 *   creates a container, activates entries by default, owns its disposal, and
 *   recreates it when the normalized config changes by shallow comparison.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
export function ContainerProvider(props: ContainerProviderProps) {
  if (!props.container && !props.config) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider requires a valid container instance or creation config."
    );
  } else if (props.container && props.config) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider requires only container or valid config object to be provided."
    );
  } else if (props.container !== undefined && !(props.container instanceof Container)) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider requires a valid container instance or creation config."
    );
  } else if (props.container !== undefined && props.config && typeof props.config !== "object") {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider requires a valid container instance or creation config."
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
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider."
    );
  }

  const needsReplacement: boolean = Boolean(
    state &&
    normalizedSource &&
    (state.source.parent !== normalizedSource.parent ||
      !shallowEqualObjects(state.source.seed, normalizedSource.seed) ||
      !shallowEqualObjects(state.source.seeds as Maybe<AnyObject>, normalizedSource.seeds as Maybe<AnyObject>) ||
      !shallowEqualArrays(state.source.entries, normalizedSource.entries) ||
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
  const activeEntries = activeState ? activeState.source.entries : getContainerEntries(activeContainer);

  useEffect(() => {
    const lifecycle: ProvisionLifecycle = (lifecycleRef.current ??= {
      pendingDestruction: new Map(),
      provisionedServices: new Map(),
    } as ProvisionLifecycle);

    retainContainer(activeContainer, lifecycle);
    provisionContainer(activeContainer, lifecycle.provisionedServices, activeEntries);

    return () => {
      if (owned) {
        scheduleContainerDestruction(activeContainer, lifecycle);
      } else {
        deprovisionContainer(activeContainer, lifecycle.provisionedServices);
      }
    };
  }, [activeContainer, activeEntries, owned]);

  return createElement(ContainerReactContext.Provider, { value: activeContainer }, props.children ?? null);
}
