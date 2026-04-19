import { type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { bindService } from "@/wirestate/core/container/bind-service";
import { ERROR_CODE_INVALID_CONTEXT, ERROR_CODE_VALIDATION_ERROR } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { applyInitialState } from "@/wirestate/core/initial-state/apply-initial-state";
import { type IIocContext, IocContext } from "@/wirestate/core/provision/ioc-context";
import type { Optional, TAnyObject } from "@/wirestate/types/general";
import type { TInitialStateEntries } from "@/wirestate/types/initial-state";
import type { TServiceClass } from "@/wirestate/types/services";

/**
 * Props for the component returned by {@link createServicesProvider}.
 */
export interface IServicesProviderProps {
  /**
   * Shared initial state applied to services on first mount.
   *
   *todo: probably makes more sense to store it in IOC provider and declare once
   */
  readonly initialState?: TAnyObject;
  /**
   * Initial state applied to services on first mount.
   * Subsequent prop changes are ignored. Use a React `key` to re-seed the tree.
   *
   * todo: probably makes more sense to store it in IOC provider and declare once
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
  dbg.info(prefix(__filename), "Creating services provider:", { services, options });

  const { activate } = options;

  if (activate && activate.length > 0) {
    for (const eager of activate) {
      if (!services.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createServicesProvider: '${eager.name}' is listed in 'activate' but was not provided in 'services'.`
        );
      }
    }
  }

  function ServicesProviderComponent(props: IServicesProviderProps) {
    const iocContext: Optional<IIocContext> = useContext(IocContext);

    if (!iocContext) {
      throw new WirestateError(
        ERROR_CODE_INVALID_CONTEXT,
        "<ServicesProvider> must be rendered inside an <IocProvider> React subtree."
      );
    }

    // Snapshot initialState on mount to ensure binding stability.
    // useState lazy initializer ensures it only runs once.
    const [initialPropsSnapshot] = useState<IServicesProviderProps>(() => props);

    useMemo(() => {
      dbg.info(prefix(__filename), "Providing services on first render:", {
        container: iocContext.container,
        revision: iocContext.revision,
        services,
        initialPropsSnapshot,
        activate,
      });

      // Seed must be applied BEFORE binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
      // todo: Conditional apply, merge or so.
      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);

      for (const ServiceClass of services) {
        bindService(iocContext.container, ServiceClass, ServiceClass, {
          isWithBindingCheck: true,
        });
      }

      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
    }, services);

    useEffect(() => {
      dbg.info(prefix(__filename), "Providing services on mount:", {
        container: iocContext.container,
        revision: iocContext.revision,
        services,
        initialPropsSnapshot,
        activate,
      });

      // Re-apply state and re-bind if container was reset (e.g. StrictMode remount or HMR).
      let didRebind: boolean = false;

      // todo: Conditional apply, merge or so.
      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);

      for (const ServiceClass of services) {
        if (!iocContext.container.isBound(ServiceClass)) {
          didRebind = true;
        }

        bindService(iocContext.container, ServiceClass, ServiceClass, {
          isWithBindingCheck: true,
        });
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
        dbg.info(prefix(__filename), "Unprovision services on unmount:", {
          container: iocContext.container,
          revision: iocContext.revision,
          services,
        });

        // Unbind in reverse order to respect dependencies during onDeactivated.
        for (const service of services) {
          if (iocContext.container.isBound(service)) {
            iocContext.container.unbind(service);
          }
        }

        // Cleanup seed to prevent memory leaks or accidental resolution in torn-down container.
        // todo: Conditional apply, remove linked keys separately or so, leave stored state as is.
        applyInitialState(iocContext.container, {}, []);
      };
    }, services);

    return props.children;
  }

  ServicesProviderComponent.displayName = "ServicesProvider";

  dbg.info(prefix(__filename), "Created services provider:", { ServicesProviderComponent, services, options });

  return ServicesProviderComponent;
}
