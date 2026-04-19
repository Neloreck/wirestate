import { type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { bindService } from "@/wirestate/core/container/bindService";
import { applyInitialState } from "@/wirestate/core/initial-state/applyInitialState";
import type { TAnyObject } from "@/wirestate/types/general";
import type { TInitialStateEntries } from "@/wirestate/types/initial-state";
import type { TServiceClass } from "@/wirestate/types/services";

import { type IIocContext, IocContext } from "./IocContext";

/**
 * Props for the component returned by {@link createServicesProvider}.
 */
export interface IServicesProviderProps {
  /**
   * Shared initial state applied to services on first mount.
   */
  readonly initialState?: TAnyObject;
  /**
   * Initial state applied to services on first mount.
   * Subsequent prop changes are ignored. Use a React `key` to re-seed the tree.
   */
  readonly initialStates?: TInitialStateEntries;
  /**
   * Subtree that consumes the bound services.
   */
  readonly children?: ReactNode;
}

/**
 * Component returned by {@link createServicesProvider}.
 */
export type ServicesProvider = ReturnType<typeof createServicesProvider>;

/**
 * Configuration for {@link createServicesProvider}.
 */
export interface ICreateIocProviderOptions {
  /**
   * Services to resolve immediately on mount.
   */
  readonly activate?: ReadonlyArray<TServiceClass>;
}

/**
 * Creates a component that manages service lifetimes for its subtree.
 *
 * @param services - service classes to bind
 * @param options - provider configuration
 * @returns service provider component
 */
export function createServicesProvider(
  services: ReadonlyArray<TServiceClass>,
  options: ICreateIocProviderOptions = {}
) {
  const { activate } = options;

  if (activate && activate.length > 0) {
    for (const eager of activate) {
      if (!services.includes(eager)) {
        throw new Error(
          `[ioc] createServicesProvider: '${eager.name}' is listed in 'activate' but was not provided in 'services'.`
        );
      }
    }
  }

  function ServicesProviderComponent(props: IServicesProviderProps) {
    const iocContext: IIocContext | null = useContext(IocContext);

    if (!iocContext) {
      throw new Error("[ioc] <ServicesProvider> must be rendered inside an <IocProvider>.");
    }

    // Snapshot initialState on mount to ensure binding stability.
    // useState lazy initializer ensures it only runs once.
    const [initialPropsSnapshot] = useState<IServicesProviderProps>(() => props);

    // Bind services synchronously on first render so descendants can resolve them immediately.
    // deps: services array (supports HMR/dynamic service lists).
    useMemo(() => {
      // Seed must be applied BEFORE binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);

      for (const ServiceClass of services) {
        bindService(iocContext.container, ServiceClass, ServiceClass, true);
      }

      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, services);

    useEffect(() => {
      // Re-apply state and re-bind if container was reset (e.g. StrictMode remount or HMR).
      let didRebind: boolean = false;

      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);

      for (const ServiceClass of services) {
        if (!iocContext.container.isBound(ServiceClass)) {
          didRebind = true;
        }

        bindService(iocContext.container, ServiceClass, ServiceClass, true);
      }

      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }

      if (didRebind) {
        // Increment revision to invalidate stale useService caches.
        iocContext.setRevision((r) => r + 1);
      }

      return () => {
        // Unbind in reverse order to respect dependencies during onDeactivated.
        for (let it = services.length - 1; it >= 0; it --) {
          if (iocContext.container.isBound(services[it])) {
            iocContext.container.unbind(services[it]);
          }
        }

        // Cleanup seed to prevent memory leaks or accidental resolution in torn-down container.
        applyInitialState(iocContext.container, {}, []);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, services);

    return props.children;
  }

  ServicesProviderComponent.displayName = "ServicesProvider";

  return ServicesProviderComponent;
}
