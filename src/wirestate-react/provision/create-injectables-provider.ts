import {
  applySeeds,
  bindEntry,
  InjectableDescriptor,
  SeedEntries,
  unapplySeeds,
  WirestateError,
  getEntryToken,
  Newable,
  type ServiceIdentifier,
} from "@wirestate/core";
import { type ReactElement, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContext, IocReactContext } from "../context/ioc-context";
import { ERROR_CODE_INVALID_CONTEXT, ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { Optional } from "../types/general";

/**
 * Props for the component returned by {@link createInjectablesProvider}.
 *
 * @group provision
 */
export interface InjectablesProviderProps {
  /**
   * Targeted seeds bound to specific injectables or tokens.
   * Subsequent prop changes are ignored. Use a React `key` to re-seed the tree.
   */
  readonly seeds?: SeedEntries;
  /**
   * Subtree that consumes the bound services.
   */
  readonly children?: ReactNode;
}

/**
 * Component returned by {@link createInjectablesProvider}.
 *
 * @group provision
 */
export type InjectablesProvider = ReturnType<typeof createInjectablesProvider>;

/**
 * Configuration for {@link createInjectablesProvider}.
 *
 * @group provision
 */
export interface CreateInjectablesProviderOptions {
  /**
   * Services to resolve immediately on mount.
   */
  readonly activate?: ReadonlyArray<ServiceIdentifier>;
}

/**
 * Creates a component that manages injectable lifetimes for its subtree.
 *
 * @group provision
 *
 * @param entries - service classes or injectable descriptors to bind
 * @param options - provider configuration
 * @returns injectables provider component
 */
export function createInjectablesProvider(
  entries: ReadonlyArray<Newable<object> | InjectableDescriptor>,
  options: CreateInjectablesProviderOptions = {}
) {
  dbg.info(prefix(__filename), "Creating injectables provider:", { services: entries, options });

  const { activate } = options;

  if (activate && activate.length > 0) {
    const entryTokens: ReadonlyArray<ServiceIdentifier> = entries.map(getEntryToken);

    for (const eager of activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createInjectablesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
        );
      }
    }
  }

  function InjectablesProviderComponent(props: InjectablesProviderProps) {
    const iocContext: Optional<IocContext> = useContext(IocReactContext);

    if (!iocContext) {
      throw new WirestateError(
        ERROR_CODE_INVALID_CONTEXT,
        "<InjectablesProvider> must be rendered inside an <IocProvider> React subtree."
      );
    }

    // Snapshot props on mount to ensure binding stability.
    // useState lazy initializer ensures it only runs once.
    const [initialPropsSnapshot] = useState<InjectablesProviderProps>(() => props);

    useMemo(() => {
      dbg.info(prefix(__filename), "Providing services on first render:", {
        container: iocContext.container,
        revision: iocContext.revision,
        services: entries,
        initialPropsSnapshot,
        activate,
      });

      // Seed must be applied BEFORE binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
      if (initialPropsSnapshot.seeds) {
        applySeeds(iocContext.container, initialPropsSnapshot.seeds);
      }

      for (const entry of entries) {
        if (!iocContext.container.isBound(getEntryToken(entry))) {
          bindEntry(iocContext.container, entry);
        }
      }

      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
    }, entries);

    useEffect(() => {
      dbg.info(prefix(__filename), "Providing services on mount:", {
        container: iocContext.container,
        revision: iocContext.revision,
        entries,
        initialPropsSnapshot,
        activate,
      });

      // Re-apply state and re-bind if container was reset (e.g. StrictMode remount or HMR).
      let didRebind: boolean = false;

      if (initialPropsSnapshot.seeds) {
        applySeeds(iocContext.container, initialPropsSnapshot.seeds);
      }

      for (const entry of entries) {
        if (!iocContext.container.isBound(getEntryToken(entry))) {
          didRebind = true;
          bindEntry(iocContext.container, entry);
        }
      }

      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }

      // Increment revision to invalidate stale injection caches.
      if (didRebind) {
        iocContext.setRevision((r) => r + 1);
      }

      return () => {
        dbg.info(prefix(__filename), "Unprovision services on unmount:", {
          container: iocContext.container,
          revision: iocContext.revision,
          entries,
        });

        for (const entry of entries) {
          const token: ServiceIdentifier = getEntryToken(entry);

          if (iocContext.container.isBound(token)) {
            iocContext.container.unbind(token);
          }
        }

        // Remove only this provider's targeted initial state entries.
        if (initialPropsSnapshot.seeds) {
          unapplySeeds(iocContext.container, initialPropsSnapshot.seeds);
        }
      };
    }, entries);

    return props.children as ReactElement;
  }

  InjectablesProviderComponent.displayName = "InjectablesProvider";

  dbg.info(prefix(__filename), "Created injectables provider:", { InjectablesProviderComponent, entries, options });

  return InjectablesProviderComponent;
}
